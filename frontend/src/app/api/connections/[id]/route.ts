import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserHandle } from '@/lib/auth'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'
import { store } from '@/lib/mock-store'
import { resolveConnectionSchema } from '@/lib/validations'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if ('error' in auth) return auth.error

  const { user } = auth
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const result = resolveConnectionSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ 
      error: 'validation_failed', 
      details: result.error.errors.map(e => ({ path: e.path, message: e.message })) 
    }, { status: 422 })
  }

  const { status } = result.data

  const myHandle = await getUserHandle(user.id)
  if (!myHandle) return NextResponse.json({ error: 'No handle found' }, { status: 404 })

  if (!SUPABASE_CONFIGURED) {
    const conn = store.connections.get(id)
    if (!conn) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (conn.target_handle_id !== myHandle.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    store.connections.set(id, { ...conn, status, resolved_at: new Date().toISOString() })
    return NextResponse.json({ success: true })
  }

  const supabase = createServiceSupabase()
  const { data: conn } = await supabase
    .from('connections').select('target_handle_id').eq('id', id).single()

  if (!conn) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (conn.target_handle_id !== myHandle.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('connections')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
