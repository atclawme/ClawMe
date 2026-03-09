'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import GitHubSignInButton from '@/components/auth/GitHubSignInButton'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/dashboard')
    })
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[#0A0A0F]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full"
        style={{ maxWidth: '360px' }}
      >
        {/* Logo */}
        <Link href="/" className="block text-center mb-10">
          <span
            className="text-[28px] font-bold text-[#6C47FF]"
            style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
          >
            ClawMe
          </span>
        </Link>

        <div className="text-center mb-8">
          <h1
            className="text-[28px] font-bold text-[#F0F0F5] mb-3"
            style={{ letterSpacing: '-0.01em' }}
            data-testid="login-heading"
          >
            Sign in to ClawMe
          </h1>
          <p className="text-[16px] text-[#8E8EA0] leading-[1.6]">
            Connect your GitHub account to claim your{' '}
            <span
              className="text-[#6C47FF]"
              style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
            >
              @handle
            </span>{' '}
            and activate your agent.
          </p>
        </div>

        <GitHubSignInButton />

        <p className="text-center text-[12px] text-[#52525B] mt-4">
          By signing in, you agree to not be a bad actor.
        </p>
      </motion.div>
    </main>
  )
}
