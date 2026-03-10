'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient, SUPABASE_READY } from '@/lib/supabase'

export default function Nav() {
  const [user, setUser] = useState<{ id: string } | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    
    if (SUPABASE_READY) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
        setUser(session?.user ?? null)
      })
      return () => subscription.unsubscribe()
    } else {
      // For mock mode, check localStorage periodically
      const checkMockSession = () => {
        const isMock = typeof window !== 'undefined' && localStorage.getItem('clawme_mock_session') === 'true'
        setUser(isMock ? { id: 'mock-user-dev' } : null)
      }
      checkMockSession()
      window.addEventListener('storage', checkMockSession)
      return () => window.removeEventListener('storage', checkMockSession)
    }
  }, [])

  const scrollToWaitlist = useCallback(() => {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center"
      style={{
        height: '60px',
        backgroundColor: 'rgba(10, 10, 15, 0.90)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #27272F',
      }}
    >
      <div
        className="mx-auto w-full flex items-center justify-between px-6"
        style={{ maxWidth: '1100px' }}
      >
        <Link href="/">
          <span
            className="font-bold text-[22px] text-[#6C47FF] tracking-tight select-none"
            style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
            data-testid="nav-logo"
          >
            ClawMe
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user === undefined ? null : user ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors"
              style={{ backgroundColor: '#6C47FF', transitionDuration: '150ms' }}
              data-testid="nav-dashboard-link"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold border border-[#3F3F50] text-[#F0F0F5] rounded-lg hover:border-[#6C47FF] hover:text-[#6C47FF] transition-all"
                style={{ transitionDuration: '150ms' }}
                data-testid="nav-signin-link"
              >
                Sign in
              </Link>
              <button
                onClick={scrollToWaitlist}
                data-testid="nav-join-waitlist-btn"
                className="px-4 py-2 text-sm font-semibold bg-[#6C47FF] text-white rounded-lg hover:bg-[#7C5CFF] transition-colors"
                style={{ transitionDuration: '150ms' }}
              >
                Join Waitlist
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
