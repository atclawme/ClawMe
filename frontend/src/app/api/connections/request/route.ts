import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserHandle } from '@/lib/auth'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'
import { store } from '@/lib/mock-store'
import { connectionRequestSchema } from '@/lib/validations'
import { apiError, apiValidationError } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return auth.error

  const { user } = auth
  const body = await request.json().catch(() => ({}))
  const result = connectionRequestSchema.safeParse(body)

  if (!result.success) {
    return apiValidationError(result.error)
  }

  const { target_handle, message } = result.data

  const requesterHandle = await getUserHandle(user.id)
  if (!requesterHandle) {
    return apiError(
      400,
      'handle_required',
      'You need a handle to send connection requests'
    )
  }

  // Prevent self-requests even if UI is bypassed.
  if (requesterHandle.handle?.toLowerCase?.().trim?.() === target_handle.toLowerCase().trim()) {
    return apiError(400, 'self_request_forbidden', 'Cannot request connection to yourself')
  }

  if (!SUPABASE_CONFIGURED) {
    const targetHandleId = store.handlesBySlug.get(target_handle.toLowerCase())
    if (!targetHandleId) {
      return apiError(404, 'target_handle_not_found', 'Target handle not found')
    }

    // Check for existing connection
    for (const conn of store.connections.values()) {
      if (
        conn.requester_handle_id === requesterHandle.id &&
        conn.target_handle_id === targetHandleId &&
        (conn.status === 'pending' || conn.status === 'approved')
      ) {
        return apiError(409, 'connection_exists', 'Connection already exists')
      }
    }

    const id = crypto.randomUUID()
    const conn = {
      id,
      requester_handle_id: requesterHandle.id,
      target_handle_id: targetHandleId,
      status: 'pending' as const,
      requester_message: message || undefined,
      created_at: new Date().toISOString(),
    }
    store.connections.set(id, conn)
    return NextResponse.json({ success: true, connection_id: id }, { status: 201 })
  }

  const supabase = createServiceSupabase()
  const { data: targetHandle } = await supabase
    .from('handles').select('id').eq('handle', target_handle.toLowerCase()).single()

  if (!targetHandle) return apiError(404, 'target_handle_not_found', 'Target handle not found')

  const { data: existing } = await supabase
    .from('connections').select('id')
    .eq('requester_handle_id', requesterHandle.id)
    .eq('target_handle_id', targetHandle.id)
    .in('status', ['pending', 'approved'])
    .maybeSingle()

  if (existing) return apiError(409, 'connection_exists', 'Connection already exists')

  const { data: conn, error } = await supabase.from('connections').insert({
    requester_handle_id: requesterHandle.id,
    target_handle_id: targetHandle.id,
    status: 'pending',
    requester_message: message || null,
  }).select('id').single()

  if (error) return apiError(500, 'connection_request_failed', 'Failed to create request')
  return NextResponse.json({ success: true, connection_id: conn.id }, { status: 201 })
}
