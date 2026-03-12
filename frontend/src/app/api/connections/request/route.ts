import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserHandle } from '@/lib/auth'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'
import { store } from '@/lib/mock-store'
import { connectionRequestSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return auth.error

  const { user } = auth
  const body = await request.json().catch(() => ({}))
  const result = connectionRequestSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ 
      error: 'validation_failed', 
      details: result.error.errors.map(e => ({ path: e.path, message: e.message })) 
    }, { status: 422 })
  }

  const { target_handle, message } = result.data

  const requesterHandle = await getUserHandle(user.id)
  if (!requesterHandle) {
    return NextResponse.json({ error: 'You need a handle to send connection requests' }, { status: 400 })
  }

  // Prevent self-requests even if UI is bypassed.
  if (requesterHandle.handle?.toLowerCase?.().trim?.() === target_handle.toLowerCase().trim()) {
    return NextResponse.json({ error: 'Cannot request connection to yourself' }, { status: 400 })
  }

  if (!SUPABASE_CONFIGURED) {
    const targetHandleId = store.handlesBySlug.get(target_handle.toLowerCase())
    if (!targetHandleId) return NextResponse.json({ error: 'Target handle not found' }, { status: 404 })

    // Check for existing connection
    for (const conn of store.connections.values()) {
      if (
        conn.requester_handle_id === requesterHandle.id &&
        conn.target_handle_id === targetHandleId &&
        (conn.status === 'pending' || conn.status === 'approved')
      ) {
        return NextResponse.json({ error: 'Connection already exists' }, { status: 409 })
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

  if (!targetHandle) return NextResponse.json({ error: 'Target handle not found' }, { status: 404 })

  const { data: existing } = await supabase
    .from('connections').select('id')
    .eq('requester_handle_id', requesterHandle.id)
    .eq('target_handle_id', targetHandle.id)
    .in('status', ['pending', 'approved'])
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Connection already exists' }, { status: 409 })

  const { data: conn, error } = await supabase.from('connections').insert({
    requester_handle_id: requesterHandle.id,
    target_handle_id: targetHandle.id,
    status: 'pending',
    requester_message: message || null,
  }).select('id').single()

  if (error) return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
  return NextResponse.json({ success: true, connection_id: conn.id }, { status: 201 })
}
