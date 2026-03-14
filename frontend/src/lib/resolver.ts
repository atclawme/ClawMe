import { createServiceSupabase, SUPABASE_CONFIGURED } from './supabase-server'
import { store } from './mock-store'

export type Tier = 1 | 2 | 3

export async function getRequesterTier(
  requesterUserId: string | null,
  targetHandleId: string
): Promise<Tier> {
  if (!requesterUserId) return 1

  if (!SUPABASE_CONFIGURED) {
    const requesterHandleId = store.handlesByOwner.get(requesterUserId)
    if (!requesterHandleId) return 3
    for (const conn of store.connections.values()) {
      if (
        conn.status === 'approved' &&
        ((conn.requester_handle_id === requesterHandleId && conn.target_handle_id === targetHandleId) ||
          (conn.target_handle_id === requesterHandleId && conn.requester_handle_id === targetHandleId))
      ) {
        return 2
      }
    }
    return 3
  }

  const supabase = createServiceSupabase()
  const { data: requesterHandle } = await supabase
    .from('handles')
    .select('id')
    .eq('owner_id', requesterUserId)
    .eq('is_system', false)
    .single()

  if (!requesterHandle) return 3

  const { data: conn } = await supabase
    .from('connections')
    .select('id')
    .eq('status', 'approved')
    .or(
      `and(requester_handle_id.eq.${requesterHandle.id},target_handle_id.eq.${targetHandleId}),` +
        `and(requester_handle_id.eq.${targetHandleId},target_handle_id.eq.${requesterHandle.id})`
    )
    .maybeSingle()

  return conn ? 2 : 3
}

export function buildA2ACard(handle: Record<string, unknown>, tier: Tier) {
  const targetGateway =
    typeof handle.target_gateway === 'string' ? handle.target_gateway : null

  const base = {
    '@context': 'https://schema.org/extensions/a2a-v1.json',
    type: 'A2AAgent',
    id: `clawme:${handle.handle}`,
    name: handle.display_name || handle.handle,
    description: handle.description || '',
    verification: {
      type: 'ClawMeVerifiedHuman',
      assertionUrl: `https://atclawme.com/v1/verify/${handle.handle}`,
    },
    supportedMethods: handle.supported_methods || [],
  }

  if (tier === 2) {
    return {
      ...base,
      endpoints: [
        {
          protocol: targetGateway?.startsWith('wss') ? 'wss' : 'https',
          uri: targetGateway || '',
          priority: 1,
          supportedMethods: handle.supported_methods || [],
        },
      ],
      publicKey: handle.public_key
        ? {
            id: `clawme:${handle.handle}#key-1`,
            type: 'Ed25519VerificationKey2020',
            publicKeyMultibase: handle.public_key,
          }
        : undefined,
    }
  }

  if (tier === 3) {
    return {
      ...base,
      connection_request_url: 'https://atclawme.com/api/connections/request',
    }
  }

  return base
}
