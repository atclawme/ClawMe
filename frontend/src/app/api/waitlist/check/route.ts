import { NextRequest, NextResponse } from 'next/server'
import { store, checkRateLimit } from '@/lib/mock-store'
import { HANDLE_REGEX, RESERVED_HANDLES } from '@/lib/validations'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const handle = request.nextUrl.searchParams.get('handle')?.toLowerCase().trim() || ''
  if (!HANDLE_REGEX.test(handle)) {
    return NextResponse.json({ error: 'Invalid handle format' }, { status: 422 })
  }
  if (RESERVED_HANDLES.has(handle)) {
    return NextResponse.json({ available: false })
  }

  if (!SUPABASE_CONFIGURED) {
    return NextResponse.json({ available: !store.waitlistByHandle.has(handle) })
  }

  const supabase = createServiceSupabase()
  const { data } = await supabase
    .from('waitlist')
    .select('id')
    .eq('desired_handle', handle)
    .maybeSingle()
  return NextResponse.json({ available: !data })
}
