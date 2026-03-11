import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserHandle } from '@/lib/auth'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'
import { store } from '@/lib/mock-store'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return auth.error

  const { user } = auth
  const myHandle = await getUserHandle(user.id)
  if (!myHandle) return NextResponse.json({ requests: [] })

  if (!SUPABASE_CONFIGURED) {
    const pending = []
    for (const conn of store.connections.values()) {
      if (conn.target_handle_id === myHandle.id && conn.status === 'pending') {
        const requesterHandle = store.handles.get(conn.requester_handle_id)
        pending.push({
          id: conn.id,
          requester_handle: requesterHandle?.handle,
          display_name: requesterHandle?.display_name,
          description: requesterHandle?.description,
          message: conn.requester_message,
          created_at: conn.created_at,
        })
      }
    }
    return NextResponse.json({ requests: pending })
  }

  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('connections')
    .select(`
      id, requester_message, created_at,
      requester_handle:handles!requester_handle_id(handle, display_name, description)
    `)
    .eq('target_handle_id', myHandle.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500 })

  const requests = (data || []).map((req: any) => ({
    id: req.id,
    requester_handle: req.requester_handle?.handle,
    display_name: req.requester_handle?.display_name,
    description: req.requester_handle?.description,
    message: req.requester_message,
    created_at: req.created_at,
  }))

  return NextResponse.json({ requests })
}
