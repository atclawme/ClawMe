'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Globe, RefreshCw, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export default function WhyHandles() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const stickyRef = useRef<HTMLDivElement | null>(null)
  const stickyTopRef = useRef(96)
  const viewportHRef = useRef(1)
  const scrollStepVh = 0.5

  const cards = useMemo(
    () => [
      {
        title: 'Dynamic endpoints',
        body: 'Home-hosted agents: router restarts change your IP. Your URLs go stale.',
        icon: RefreshCw as LucideIcon,
      },
      {
        title: 'Ephemeral compute',
        body: 'Spot instances: every restart gives you a new URL.',
        icon: Zap as LucideIcon,
      },
      {
        title: 'Avoid DNS overhead',
        body: 'Non-DNS people: domains and TLS are overkill for personal agents.',
        icon: Globe as LucideIcon,
      },
    ],
    []
  )

  const [active, setActive] = useState(0)
  const [viewportH, setViewportH] = useState(0)
  const [, forceStickyTopRerender] = useState(0)

  useEffect(() => {
    const onResize = () => {
      const vh = window.innerHeight || 1
      viewportHRef.current = vh
      setViewportH(vh)

      const stickyEl = stickyRef.current
      const stickyH = stickyEl ? stickyEl.getBoundingClientRect().height : 0
      const centeredTop = Math.max(96, Math.round((vh - stickyH) / 2))
      stickyTopRef.current = centeredTop
      forceStickyTopRerender((x) => x + 1)
    }

    const onScroll = () => {
      const el = sectionRef.current
      if (!el) return

      const start = el.getBoundingClientRect().top + window.scrollY - stickyTopRef.current
      const step = Math.max(viewportHRef.current * scrollStepVh, 1)
      const y = window.scrollY

      const raw = Math.floor((y - start) / step)
      const idx = Math.min(cards.length - 1, Math.max(0, raw))
      setActive(idx)
    }

    onResize()
    onScroll()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [cards.length])

  return (
    <section
      ref={(node) => {
        sectionRef.current = node
      }}
      className="py-[96px] px-6 bg-[#0A0A0F]"
      data-testid="why-handles-section"
    >
      <div className="mx-auto" style={{ maxWidth: '1100px' }}>
        <div
          className="relative"
          style={{
            minHeight: viewportH
              ? `${viewportH * scrollStepVh * (cards.length + 1)}px`
              : `${scrollStepVh * (cards.length + 1) * 100}vh`,
          }}
        >
          <div
            ref={(node) => {
              stickyRef.current = node
            }}
            className="sticky"
            style={{ top: `${stickyTopRef.current}px` }}
          >
            <div className="mx-auto" style={{ maxWidth: '920px' }}>
              <div className="text-center mb-10">
                <p
                  className="text-[13px] font-medium uppercase text-[#8E8EA0] mb-3"
                  style={{ letterSpacing: '0.1em' }}
                >
                  Why
                </p>
                <h2
                  className="text-[36px] font-bold text-[#F0F0F5]"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  Why the agentic web needs{' '}
                  <span
                    className="text-[#6C47FF]"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
                  >
                    @handles
                  </span>
                </h2>
              </div>

              <p
                className="text-[16px] text-[#A1A1B5] leading-[1.7] text-center mx-auto mb-10"
                style={{ maxWidth: '760px' }}
              >
                Built for OpenClaw and self-hosted AI agents on home Wi-Fi, spot instances, and tunnels,
                where IPs change and domains are annoying.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
                <div
                  className="rounded-xl border p-6 relative overflow-hidden md:col-span-2 md:col-start-2"
                  style={{ backgroundColor: '#13131A', borderColor: '#27272F' }}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`icon-${active}`}
                      className="absolute -top-6 -right-6 select-none text-[#6C47FF]"
                      style={{ opacity: 0.18 }}
                      aria-hidden="true"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.18 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      {(() => {
                        const Icon = cards[active].icon
                        return <Icon className="w-[120px] h-[120px]" />
                      })()}
                    </motion.span>
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      <p
                        className="text-[13px] font-medium uppercase text-[#F0F0F5] mb-3 relative z-10"
                        style={{ letterSpacing: '0.1em' }}
                      >
                        {cards[active].title}
                      </p>
                      <p className="text-[15px] text-[#8E8EA0] leading-[1.7] relative z-10">{cards[active].body}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div
                  className="rounded-xl p-6 md:col-start-4 md:col-span-2"
                  style={{ backgroundColor: '#0A0A0F' }}
                >
                  <div className="space-y-3">
                    {cards.map((c, i) => (
                      <div key={c.title} className="flex items-center gap-3">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: i === active ? '#6C47FF' : '#3F3F50' }}
                        />
                        <span className="text-[14px]" style={{ color: i === active ? '#F0F0F5' : '#8E8EA0' }}>
                          {c.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-[16px] text-[#8E8EA0] leading-[1.7] mt-10 text-center mx-auto" style={{ maxWidth: '820px' }}>
                Google&apos;s A2A expects stable domains and{' '}
                <span
                  style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
                >
                  .well-known/agent.json
                </span>
                . Great for big companies, broken for everyone else.{' '}
                <span
                  className="text-[#6C47FF]"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
                >
                  @ClawMe
                </span>{' '}
                is the shared directory and{' '}
                <span
                  className="text-[#6C47FF]"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
                >
                  @handle
                </span>{' '}
                layer on top.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
