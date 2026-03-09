'use client'

import { useCallback } from 'react'

export default function Nav() {
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
        <span
          className="font-bold text-[22px] text-[#6C47FF] tracking-tight select-none"
          style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
          data-testid="nav-logo"
        >
          ClawMe
        </span>
        <button
          onClick={scrollToWaitlist}
          data-testid="nav-join-waitlist-btn"
          className="px-4 py-2 text-sm font-semibold border border-[#3F3F50] text-[#F0F0F5] rounded-lg hover:border-[#6C47FF] hover:text-[#6C47FF] transition-all"
          style={{ transitionDuration: '150ms' }}
        >
          Join Waitlist
        </button>
      </div>
    </nav>
  )
}
