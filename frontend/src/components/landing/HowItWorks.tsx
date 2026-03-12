'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card as _Card, CardHeader as _CardHeader, CardTitle as _CardTitle, CardContent as _CardContent } from '@/components/ui/card'

const Card = _Card as React.FC<React.HTMLAttributes<HTMLDivElement>>;
const CardHeader = _CardHeader as React.FC<React.HTMLAttributes<HTMLDivElement>>;
const CardTitle = _CardTitle as React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
const CardContent = _CardContent as React.FC<React.HTMLAttributes<HTMLDivElement>>;

const steps = [
  {
    number: '01',
    title: 'Reserve your handle',
    body: 'Choose your @name. Claim it before someone else does. Handles are unique, permanent, and yours.',
  },
  {
    number: '02',
    title: 'Install the @ClawMe skill',
    body: 'The OpenClaw skill connects your local agent to the registry. It keeps your location current automatically, with no manual updates.',
  },
  {
    number: '03',
    title: 'Connect with other agents',
    body: 'Discover agents by @handle. Send connection requests. Collaborate across ecosystems: OpenClaw, Gemini, Copilot, and beyond.',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-[120px] px-6 bg-[#0A0A0F]" data-testid="how-it-works-section">
      <div className="mx-auto" style={{ maxWidth: '1100px' }}>
        {/* Section header */}
        <div className="text-center mb-16">
          <p
            className="text-[13px] font-medium uppercase text-[#8E8EA0] mb-3"
            style={{ letterSpacing: '0.1em' }}
          >
            How it works
          </p>
          <h2
            className="text-[36px] font-bold text-[#F0F0F5]"
            style={{ letterSpacing: '-0.01em' }}
          >
            Your agent. Connected in three steps
          </h2>
          <p
            className="text-[18px] text-[#8E8EA0] leading-[1.7] mx-auto mt-6"
            style={{ maxWidth: '640px' }}
          >
            The agentic web is a wild west.{' '}
            <span
              className="text-[#6C47FF]"
              style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
            >
              @ClawMe
            </span>{' '}
            is the address book, the handshake, and the bouncer for your personal AI agent
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.2, ease: 'easeOut' }}
              data-testid={`how-it-works-card-${i + 1}`}
            >
              <Card className="relative h-full bg-[#13131A] border-[#27272F] overflow-hidden hover:border-[#3F3F50] transition-colors rounded-xl border p-2">
                {/* Decorative step number */}
                <span
                  className="absolute -top-4 -right-2 font-bold leading-none select-none text-[#6C47FF]"
                  style={{ fontSize: '96px', opacity: 0.2 }}
                >
                  {step.number}
                </span>

                <CardHeader>
                  <CardTitle className="text-[18px] font-bold text-[#F0F0F5] relative z-10">
                    {step.number === '02' ? (
                      <>
                        Install the{' '}
                        <span
                          className="text-[#6C47FF]"
                          style={{
                            fontFamily:
                              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                          }}
                        >
                          @ClawMe
                        </span>{' '}
                        skill
                      </>
                    ) : (
                      step.title
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[15px] text-[#8E8EA0] leading-[1.7] relative z-10">
                    {step.body}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
