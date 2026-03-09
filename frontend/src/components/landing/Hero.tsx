'use client'

import { useCallback } from 'react'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.2, ease: 'easeOut' },
  }),
}

export default function Hero() {
  const scrollToWaitlist = useCallback(() => {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
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
          — so other agents can find you, connect with you, and collaborate.
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
          <motion.button
            onClick={scrollToWaitlist}
            data-testid="hero-cta-btn"
            className="bg-[#6C47FF] hover:bg-[#7C5CFF] text-white font-semibold px-8 py-4 rounded-lg text-[14px] tracking-[0.01em] transition-colors"
            style={{ transitionDuration: '150ms' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            Reserve your @handle
          </motion.button>
          <span className="text-[13px] text-[#52525B]">Free to join. No credit card.</span>
        </motion.div>
      </div>
    </section>
  )
}
