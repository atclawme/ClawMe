import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/mock-store'
import { waitlistSchema } from '@/lib/validations'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const result = waitlistSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ 
      error: 'validation_failed', 
      details: result.error.errors.map(e => ({ path: e.path, message: e.message })) 
    }, { status: 422 })
  }

  const { email, desired_handle, source } = result.data
  const handle = desired_handle || null

  if (!SUPABASE_CONFIGURED) {
    if (store.waitlistByEmail.has(email)) {
      return NextResponse.json({ error: 'already_registered' }, { status: 409 })
    }
    if (handle && store.waitlistByHandle.has(handle)) {
      return NextResponse.json({ error: 'handle_taken' }, { status: 409 })
    }
    const id = crypto.randomUUID()
    store.waitlist.set(id, { id, email, desired_handle: handle || undefined, source: source || 'landing_page', created_at: new Date().toISOString() })
    store.waitlistByEmail.set(email, id)
    if (handle) store.waitlistByHandle.set(handle, id)
    return NextResponse.json({ success: true, handle }, { status: 201 })
  }

  const supabase = createServiceSupabase()
  const payload: Record<string, string | null> = { email, source: source || 'landing_page' }
  if (handle) payload.desired_handle = handle

  const { error } = await supabase.from('waitlist').insert(payload)
  if (error) {
    if (error.code === '23505') {
      if (error.details?.includes('desired_handle') || error.message?.includes('desired_handle')) {
        return NextResponse.json({ error: 'handle_taken' }, { status: 409 })
      }
      return NextResponse.json({ error: 'already_registered' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
  return NextResponse.json({ success: true, handle }, { status: 201 })
}
