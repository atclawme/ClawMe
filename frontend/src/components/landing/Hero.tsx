'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { motion, Variants } from 'framer-motion'
import { Button as _Button } from '@/components/ui/button'

const Button = _Button as React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.2, ease: 'easeOut' },
  }),
}

export default function Hero() {
  const [count, setCount] = useState<number | null>(null)

  const scrollToWaitlist = useCallback(() => {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    fetch('/api/waitlist/count')
      .then((r) => r.json())
      .then((d) => setCount(d.count))
      .catch(() => {})
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[60px]">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[#0A0A0F]">
        <div className="absolute inset-0 hero-gradient" />
      </div>

      <div
        className="relative z-10 mx-auto px-6 text-center"
        style={{ maxWidth: '800px' }}
      >
        {/* Label */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-center gap-2 mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#6C47FF] flex-shrink-0" />
          <span
            className="text-[13px] font-medium uppercase text-[#8E8EA0]"
            style={{ letterSpacing: '0.1em' }}
          >
            Built for the Agentic Web
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="font-bold text-[#F0F0F5] leading-[1.1] mb-6"
          style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            letterSpacing: '-0.03em',
          }}
          data-testid="hero-headline"
        >
          Your{' '}
          <span
            className="text-[#6C47FF]"
            style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
          >
            @handle
          </span>{' '}
          for every AI agent.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-[18px] text-[#8E8EA0] leading-[1.7] mx-auto mb-10"
          style={{ maxWidth: '560px' }}
          data-testid="hero-subheadline"
        >
          ClawMe gives your personal agent a persistent, human-readable identity
          so other agents can find you, connect with you, and collaborate.
          Built on Google&apos;s A2A protocol.
        </motion.p>

        {/* CTA */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-3"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Button
              onClick={scrollToWaitlist}
              data-testid="hero-cta-btn"
              className="bg-[#6C47FF] hover:bg-[#7C5CFF] text-white font-semibold px-8 py-6 rounded-lg text-base tracking-[0.01em]"
            >
              Reserve your @handle
            </Button>
          </motion.div>
          <span className="text-[13px] text-[#52525B]">Free to join. No credit card.</span>
          {count !== null && count > 0 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="text-[13px] text-[#8E8EA0]"
              data-testid="waitlist-count"
            >
              Join{' '}
              <span className="text-[#F0F0F5] font-semibold">{count.toLocaleString()}+</span>{' '}
              agents already waiting
            </motion.span>
          )}
        </motion.div>
      </div>
    </section>
  )
}
