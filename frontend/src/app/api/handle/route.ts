import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserHandle } from '@/lib/auth'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'
import { store } from '@/lib/mock-store'
import { HANDLE_REGEX, RESERVED_HANDLES } from '@/lib/validations'

// POST — initial claim
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return auth.error

  const { user } = auth
  const body = await request.json().catch(() => ({}))
  const handle = body.handle?.toLowerCase().trim()

  if (!handle || !HANDLE_REGEX.test(handle)) {
    return NextResponse.json({ error: 'Invalid handle format' }, { status: 422 })
  }
  if (RESERVED_HANDLES.has(handle)) {
    return NextResponse.json({ error: 'Handle is reserved' }, { status: 422 })
  }

  // Check if user already has a handle
  const existing = await getUserHandle(user.id)
  if (existing) return NextResponse.json({ error: 'Handle already claimed' }, { status: 409 })

  if (!SUPABASE_CONFIGURED) {
    if (store.handlesBySlug.has(handle)) {
      return NextResponse.json({ error: 'handle_taken' }, { status: 409 })
    }
    const id = crypto.randomUUID()
    const newHandle = {
      id,
      handle,
      owner_id: user.id,
      visibility_tier: 1,
      trust_score: 0,
      created_at: new Date().toISOString(),
    }
    store.handles.set(id, newHandle)
    store.handlesByOwner.set(user.id, id)
    store.handlesBySlug.set(handle, id)
    return NextResponse.json(newHandle, { status: 201 })
  }

  const supabase = createServiceSupabase()
  // Check handle uniqueness
  const { data: taken } = await supabase.from('handles').select('id').eq('handle', handle).maybeSingle()
  if (taken) return NextResponse.json({ error: 'handle_taken' }, { status: 409 })

  const { data, error } = await supabase
    .from('handles')
    .insert({ handle, owner_id: user.id, visibility_tier: 1, trust_score: 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to claim handle' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PUT — update handle fields
export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return auth.error

  const { user } = auth
  const body = await request.json().catch(() => ({}))
  const allowed = ['description', 'supported_methods', 'visibility_tier', 'auto_approve_rules', 'public_key', 'display_name', 'target_gateway']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (!SUPABASE_CONFIGURED) {
    const handleId = store.handlesByOwner.get(user.id)
    if (!handleId) return NextResponse.json({ error: 'No handle found' }, { status: 404 })
    const current = store.handles.get(handleId)!
    const updated = { ...current, ...updates }
    store.handles.set(handleId, updated)
    return NextResponse.json(updated)
  }

  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('handles')
    .update(updates)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json(data)
}
