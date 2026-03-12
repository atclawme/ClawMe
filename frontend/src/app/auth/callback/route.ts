import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { SUPABASE_CONFIGURED, createServiceSupabase } from '@/lib/supabase-server'
import { errToLogObject, logger } from '@/lib/logger'

/**
 * GET /auth/callback
 * 
 * Handles GitHub OAuth callback. After successful authentication:
 * 1. Check if user already has a handle → redirect to /dashboard
 * 2. Check if user's email is on the waitlist with a reserved handle:
 *    - If the reserved handle is still available, auto-claim it
 *    - Redirect to /dashboard
 * 3. If not on waitlist or no handle reserved → redirect to /claim
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin

  // If Supabase is not configured, redirect to login with error
  if (!SUPABASE_CONFIGURED) {
    return NextResponse.redirect(`${origin}/login?error=supabase_not_configured`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login`)

  const service = createServiceSupabase()
  if (!service) return NextResponse.redirect(`${origin}/claim`)

  // 1. Check if user already has a handle
  const { data: existingHandle } = await service
    .from('handles')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (existingHandle) {
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // 2. Check if user's email is on the waitlist with a reserved handle
  const userEmail = user.email?.toLowerCase()

  if (userEmail) {
    const { data: waitlistEntry } = await service
      .from('waitlist')
      .select('id, desired_handle')
      .ilike('email', userEmail)
      .maybeSingle()

    if (waitlistEntry?.desired_handle) {
      const reservedHandle = waitlistEntry.desired_handle.toLowerCase()

      // Check if the reserved handle is still available (not claimed by someone else)
      const { data: handleTaken } = await service
        .from('handles')
        .select('id')
        .eq('handle', reservedHandle)
        .maybeSingle()

      if (!handleTaken) {
        // Auto-claim the reserved handle for this user
        const { error: claimError } = await service
          .from('handles')
          .insert({
            handle: reservedHandle,
            owner_id: user.id,
            visibility_tier: 3,
            trust_score: 0,
          })

        if (!claimError) {
          // Successfully auto-claimed! Redirect to dashboard
          return NextResponse.redirect(`${origin}/dashboard?welcome=true`)
        } else {
          logger.error({ err: errToLogObject(claimError) }, 'auth/callback: auto-claim failed')
        }
        // If claim failed (race condition?), fall through to /claim
      }
      // Handle was already taken by someone else, go to /claim to pick a new one
    }
  }

  // 3. No waitlist reservation or handle already taken → manual claim
  return NextResponse.redirect(`${origin}/claim`)
}
