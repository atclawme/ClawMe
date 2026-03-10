'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Settings, LogOut, Menu, X } from 'lucide-react'
import { createClient, setMockSession, SUPABASE_READY } from '@/lib/supabase'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const signOut = async () => {
    if (!SUPABASE_READY) {
      // Mock mode - clear mock session
      setMockSession(false)
    } else {
      const supabase = createClient()
      await supabase.auth.signOut()
    }
    router.push('/login')
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 mb-4" style={{ borderBottom: '1px solid #27272F' }}>
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <span
            className="text-[20px] font-bold text-[#6C47FF]"
            style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
          >
            ClawMe
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors"
              style={{
                backgroundColor: active ? '#6C47FF1A' : 'transparent',
                color: active ? '#6C47FF' : '#8E8EA0',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = '#1C1C28' }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-5">
        <button onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left text-[#8E8EA0] transition-colors"
          style={{ transitionDuration: '150ms' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.backgroundColor = '#EF444410' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#8E8EA0'; e.currentTarget.style.backgroundColor = 'transparent' }}
          data-testid="sign-out-btn"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="fixed left-0 top-0 h-full hidden md:flex flex-col z-40"
        style={{ width: '240px', backgroundColor: '#13131A', borderRight: '1px solid #27272F' }}
      >
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[60px] flex items-center justify-between px-5 md:hidden z-50"
        style={{ backgroundColor: '#13131A', borderBottom: '1px solid #27272F' }}
      >
        <span
          className="text-[20px] font-bold text-[#6C47FF]"
          style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
        >
          ClawMe
        </span>
        <button onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5 text-[#F0F0F5]" /> : <Menu className="w-5 h-5 text-[#F0F0F5]" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 h-full flex flex-col"
            style={{ width: '240px', backgroundColor: '#13131A' }}
            onClick={(e) => e.stopPropagation()}
          >
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}
