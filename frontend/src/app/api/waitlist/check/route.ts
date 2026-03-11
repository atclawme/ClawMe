import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { store } from '@/lib/mock-store'
import { HANDLE_REGEX, RESERVED_HANDLES } from '@/lib/validations'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'

/**
 * GET /api/waitlist/check?handle=xxx&email=xxx
 * 
 * Checks if a handle is available. A handle is considered taken if:
 * 1. It's in the RESERVED_HANDLES set (system reserved)
 * 2. It's claimed in the `handles` table (active handle)
 * 3. It's reserved in the `waitlist` table by a DIFFERENT email
 * 
 * If the requesting user's email matches the waitlist reservation, 
 * the handle is available for THEM to claim.
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const { success } = await checkRateLimit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const handle = request.nextUrl.searchParams.get('handle')?.toLowerCase().trim() || ''
  const email = request.nextUrl.searchParams.get('email')?.toLowerCase().trim() || ''

  if (!HANDLE_REGEX.test(handle)) {
    return NextResponse.json({ error: 'Invalid handle format' }, { status: 422 })
  }
  
  // System reserved handles are never available
  if (RESERVED_HANDLES.has(handle)) {
    return NextResponse.json({ available: false, reason: 'reserved' })
  }

  if (!SUPABASE_CONFIGURED) {
    // Mock mode: Check both stores
    
    // 1. Check if handle is already claimed (active)
    if (store.handlesBySlug.has(handle)) {
      return NextResponse.json({ available: false, reason: 'claimed' })
    }
    
    // 2. Check waitlist reservation
    const waitlistId = store.waitlistByHandle.get(handle)
    if (waitlistId) {
      const reservation = store.waitlist.get(waitlistId)
      // If no email provided or different email, it's reserved by someone else
      if (!email || reservation?.email !== email) {
        return NextResponse.json({ available: false, reason: 'waitlist_reserved' })
      }
      // Same email - they own this reservation, so it's available to them
      return NextResponse.json({ available: true, reserved_for_you: true })
    }
    
    // Not claimed and not on waitlist - fully available
    return NextResponse.json({ available: true })
  }

  // Production mode with Supabase
  const supabase = createServiceSupabase()
  
  // 1. Check if handle is already claimed (active)
  const { data: claimed } = await supabase
    .from('handles')
    .select('id')
    .eq('handle', handle)
    .maybeSingle()
  
  if (claimed) {
    return NextResponse.json({ available: false, reason: 'claimed' })
  }
  
  // 2. Check waitlist reservation
  const { data: reservation } = await supabase
    .from('waitlist')
    .select('id, email')
    .eq('desired_handle', handle)
    .maybeSingle()
  
  if (reservation) {
    // If no email provided or different email, it's reserved by someone else
    if (!email || reservation.email !== email) {
      return NextResponse.json({ available: false, reason: 'waitlist_reserved' })
    }
    // Same email - they own this reservation
    return NextResponse.json({ available: true, reserved_for_you: true })
  }
  
  // Not claimed and not on waitlist - fully available
  return NextResponse.json({ available: true })
}
