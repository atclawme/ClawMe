import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'
import { apiError } from '@/lib/api-response'
import { errToLogObject, logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { email, referral_source, other_details } = body

  if (!email || !referral_source) {
    return apiError(422, 'missing_fields', 'Missing required fields')
  }

  if (!SUPABASE_CONFIGURED) {
    // For local development/mock store, we just log it as the mock store doesn't have a referrals table yet
    logger.info(
      { email, referral_source, other_details },
      'mock: received waitlist referral survey'
    )
    return NextResponse.json({ success: true }, { status: 201 })
  }

  const supabase = createServiceSupabase()
  const { error } = await supabase.from('waitlist_referrals').insert({
    email,
    referral_source,
    other_details
  })

  if (error) {
    logger.error({ err: errToLogObject(error) }, 'db: failed saving referral')
    return apiError(500, 'database_error', 'Database error')
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
