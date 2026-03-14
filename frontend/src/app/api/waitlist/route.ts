import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/mock-store'
import { waitlistSchema } from '@/lib/validations'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'
import { apiError, apiValidationError } from '@/lib/api-response'

function normalizeSource(input: string | undefined): string {
  if (!input) return 'landing_page'
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_\-]/g, '')
    .slice(0, 64)
  return normalized || 'landing_page'
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const result = waitlistSchema.safeParse(body)

  if (!result.success) {
    return apiValidationError(result.error)
  }

  const { email, desired_handle, source } = result.data
  const handle = desired_handle || null
  const safeSource = normalizeSource(source)

  if (!SUPABASE_CONFIGURED) {
    if (store.waitlistByEmail.has(email)) {
      return apiError(409, 'already_registered', 'Already registered')
    }
    if (handle && store.waitlistByHandle.has(handle)) {
      return apiError(409, 'handle_taken', 'Handle is already taken')
    }
    const id = crypto.randomUUID()
    store.waitlist.set(id, { id, email, desired_handle: handle || undefined, source: safeSource, created_at: new Date().toISOString() })
    store.waitlistByEmail.set(email, id)
    if (handle) store.waitlistByHandle.set(handle, id)
    return NextResponse.json({ success: true, handle }, { status: 201 })
  }

  const supabase = createServiceSupabase()
  const payload: Record<string, string | null> = { email, source: safeSource }
  if (handle) payload.desired_handle = handle

  const { error } = await supabase.from('waitlist').insert(payload)
  if (error) {
    if (error.code === '23505') {
      if (error.details?.includes('desired_handle') || error.message?.includes('desired_handle')) {
        return apiError(409, 'handle_taken', 'Handle is already taken')
      }
      return apiError(409, 'already_registered', 'Already registered')
    }
    return apiError(500, 'database_error', 'Database error')
  }
  return NextResponse.json({ success: true, handle }, { status: 201 })
}
