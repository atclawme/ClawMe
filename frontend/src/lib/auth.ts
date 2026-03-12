import { createServerSupabase, createServiceSupabase, SUPABASE_CONFIGURED } from './supabase-server'
import { store, MOCK_USER_ID } from './mock-store'
import { apiError } from './api-response'

export async function getUser() {
  if (!SUPABASE_CONFIGURED) return { id: MOCK_USER_ID, email: 'dev@mock.local' }
  try {
    const supabase = await createServerSupabase()
    if (!supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

export async function getUserFromToken(token: string) {
  if (!SUPABASE_CONFIGURED) return { id: MOCK_USER_ID, email: 'dev@mock.local' }
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await sb.auth.getUser(token)
    return user
  } catch {
    return null
  }
}

export async function requireAuth(request?: Request) {
  // Support Bearer token for skill/API access
  const authHeader = request?.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  const user = token && token !== 'Bearer'
    ? await getUserFromToken(token)
    : await getUser()

  if (!user) {
    return { error: apiError(401, 'unauthorized', 'Unauthorized') }
  }
  return { user }
}

export async function getUserHandle(userId: string) {
  if (!SUPABASE_CONFIGURED) {
    const handleId = store.handlesByOwner.get(userId)
    if (!handleId) return null
    return store.handles.get(handleId) || null
  }
  const supabase = createServiceSupabase()
  const { data } = await supabase
    .from('handles')
    .select('*')
    .eq('owner_id', userId)
    .eq('is_system', false)
    .single()
  return data
}
