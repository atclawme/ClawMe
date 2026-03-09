import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { getRequesterTier, buildA2ACard } from '@/lib/resolver'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'
import { store } from '@/lib/mock-store'
import { HANDLE_REGEX } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle: rawHandle } = await params
  const handle = rawHandle.replace('@', '').toLowerCase().trim()

  if (!HANDLE_REGEX.test(handle)) {
    return NextResponse.json({ error: 'Invalid handle format' }, { status: 422 })
  }

  // Get the auth user (optional for resolver)
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  let userId: string | null = null

  if (token && SUPABASE_CONFIGURED) {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await sb.auth.getUser(token)
    userId = user?.id || null
  } else if (!token) {
    const user = await getUser()
    userId = user?.id || null
  }

  let handleData: Record<string, unknown> | null = null

  if (!SUPABASE_CONFIGURED) {
    const handleId = store.handlesBySlug.get(handle)
    if (!handleId) return NextResponse.json({ error: 'Handle not found' }, { status: 404 })
    handleData = store.handles.get(handleId) as Record<string, unknown> || null
  } else {
    const supabase = createServiceSupabase()
    const { data } = await supabase.from('handles').select('*').eq('handle', handle).single()
    handleData = data
  }

  if (!handleData) return NextResponse.json({ error: 'Handle not found' }, { status: 404 })

  const tier = await getRequesterTier(userId, String(handleData.id))
  const card = buildA2ACard(handleData, tier)

  return NextResponse.json(card, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
