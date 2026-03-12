'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient, SUPABASE_READY } from '@/lib/supabase'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'

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
        borderBottom: '1px solid #000000',
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
            @ClawMe
          </span>
        </Link>

        <NavigationMenu className="flex-none">
          <NavigationMenuList className="flex items-center gap-5">
            {user === undefined ? null : user ? (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/dashboard"
                    data-testid="nav-dashboard-link"
                    className="text-[14px] font-medium text-[#D1D1DC] hover:text-white transition-colors duration-150"
                  >
                    Dashboard
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ) : (
              <>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/login"
                      data-testid="nav-signin-link"
                      className="text-[14px] font-medium text-[#A1A1B5] hover:text-white transition-colors duration-150"
                    >
                      Sign in
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <button
                      type="button"
                      onClick={scrollToWaitlist}
                      data-testid="nav-join-waitlist-btn"
                      className="text-[14px] font-medium text-[#9F87FF] hover:text-[#6C47FF] transition-colors duration-150"
                    >
                      Join waitlist
                    </button>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  )
}
