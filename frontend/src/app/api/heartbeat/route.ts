import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserHandle } from '@/lib/auth'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'
import { store } from '@/lib/mock-store'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return auth.error

  const { user } = auth
  const body = await request.json().catch(() => ({}))
  const { gateway } = body

  if (!gateway || (!gateway.startsWith('https://') && !gateway.startsWith('wss://'))) {
    return NextResponse.json({ error: 'Invalid gateway URL. Must start with https:// or wss://' }, { status: 422 })
  }

  const handle = await getUserHandle(user.id)
  if (!handle) {
    return NextResponse.json({ error: 'No handle registered' }, { status: 404 })
  }

  const now = new Date().toISOString()

  if (!SUPABASE_CONFIGURED) {
    const updated = { ...handle, target_gateway: gateway, last_heartbeat: now }
    store.handles.set(handle.id, updated)
    return NextResponse.json({ success: true, last_heartbeat: now })
  }

  const supabase = createServiceSupabase()
  const { error } = await supabase
    .from('handles')
    .update({ target_gateway: gateway, last_heartbeat: now })
    .eq('owner_id', user.id)

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json({ success: true, last_heartbeat: now })
}
