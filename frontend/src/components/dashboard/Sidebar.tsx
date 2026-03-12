'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Settings, LogOut, Menu } from 'lucide-react'
import { createClient, setMockSession, SUPABASE_READY } from '@/lib/supabase'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

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
      <div className="px-5 py-5 mb-4 border-b border-border/60">
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <span
            className="text-[20px] font-bold text-[#6C47FF]"
            style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
          >
            @ClawMe
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-2 space-y-1 text-sm">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              ].join(' ')}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-5">
        <Button
          onClick={signOut}
          variant="ghost"
          className="flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          data-testid="sign-out-btn"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="fixed left-0 top-0 z-40 hidden h-full w-60 flex-col border-r border-border/60 bg-background/95 backdrop-blur md:flex"
      >
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-[60px] items-center justify-between border-b border-border/60 bg-background/95 px-5 md:hidden">
        <span
          className="text-[20px] font-bold text-[#6C47FF]"
          style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
        >
          @ClawMe
        </span>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 border-r border-border/60 bg-background/95">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
