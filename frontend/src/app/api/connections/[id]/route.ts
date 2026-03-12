import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserHandle } from '@/lib/auth'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'
import { store } from '@/lib/mock-store'
import { resolveConnectionSchema } from '@/lib/validations'
import { apiError, apiValidationError } from '@/lib/api-response'

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
    return apiValidationError(result.error)
  }

  const { status } = result.data

  const myHandle = await getUserHandle(user.id)
  if (!myHandle) return apiError(404, 'handle_not_found', 'No handle found')

  if (!SUPABASE_CONFIGURED) {
    const conn = store.connections.get(id)
    if (!conn) return apiError(404, 'not_found', 'Not found')
    if (conn.target_handle_id !== myHandle.id) {
      return apiError(403, 'forbidden', 'Forbidden')
    }
    store.connections.set(id, { ...conn, status, resolved_at: new Date().toISOString() })
    return NextResponse.json({ success: true })
  }

  const supabase = createServiceSupabase()
  const { data: conn } = await supabase
    .from('connections').select('target_handle_id').eq('id', id).single()

  if (!conn) return apiError(404, 'not_found', 'Not found')
  if (conn.target_handle_id !== myHandle.id) {
    return apiError(403, 'forbidden', 'Forbidden')
  }

  const { error } = await supabase
    .from('connections')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return apiError(500, 'update_failed', 'Update failed')
  return NextResponse.json({ success: true })
}
