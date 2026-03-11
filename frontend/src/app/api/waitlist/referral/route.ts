import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { email, referral_source, other_details } = body

  if (!email || !referral_source) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 })
  }

  if (!SUPABASE_CONFIGURED) {
    // For local development/mock store, we just log it as the mock store doesn't have a referrals table yet
    console.log('Mock Store: Received referral survey:', { email, referral_source, other_details })
    return NextResponse.json({ success: true }, { status: 201 })
  }

  const supabase = createServiceSupabase()
  const { error } = await supabase.from('waitlist_referrals').insert({
    email,
    referral_source,
    other_details
  })

  if (error) {
    console.error('Database error saving referral:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
