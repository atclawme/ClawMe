import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { SUPABASE_CONFIGURED, createServiceSupabase } from '@/lib/supabase-server'

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

  // Check if user already has a handle
  const service = createServiceSupabase()
  if (service) {
    const { data: existing } = await service
      .from('handles')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    return NextResponse.redirect(`${origin}${existing ? '/dashboard' : '/claim'}`)
  }

  return NextResponse.redirect(`${origin}/claim`)
}
