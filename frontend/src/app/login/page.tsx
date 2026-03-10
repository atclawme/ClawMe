'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import GitHubSignInButton from '@/components/auth/GitHubSignInButton'
import { createClient, SUPABASE_READY, setMockSession } from '@/lib/supabase'
import Link from 'next/link'
import { Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [mockLoading, setMockLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/dashboard')
    })
  }, [router])

  const handleMockLogin = async () => {
    setMockLoading(true)
    setMockSession(true)
    // Small delay for UX
    await new Promise((r) => setTimeout(r, 500))
    // Use window.location for a full page reload to ensure all components pick up the new session
    window.location.href = '/dashboard'
  }

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

        {SUPABASE_READY ? (
          <GitHubSignInButton />
        ) : (
          <div className="space-y-4">
            {/* Mock Mode Banner */}
            <div
              className="rounded-lg p-3 flex items-start gap-3"
              style={{ backgroundColor: '#F59E0B15', border: '1px solid #F59E0B40' }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
              <div>
                <p className="text-[13px] font-medium" style={{ color: '#F59E0B' }}>
                  Development Mode
                </p>
                <p className="text-[12px] text-[#8E8EA0] mt-1">
                  Supabase credentials not configured. Using mock authentication for local development.
                </p>
              </div>
            </div>

            {/* Mock Login Button */}
            <button
              onClick={handleMockLogin}
              disabled={mockLoading}
              data-testid="mock-login-btn"
              className="w-full h-12 flex items-center justify-center gap-3 rounded-lg font-semibold text-sm text-white transition-colors"
              style={{
                backgroundColor: '#6C47FF',
                transitionDuration: '150ms',
              }}
            >
              {mockLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Continue in Dev Mode
                </>
              )}
            </button>

            {/* Disabled GitHub Button */}
            <button
              disabled
              className="w-full h-12 flex items-center justify-center gap-3 rounded-lg font-semibold text-sm transition-colors opacity-50 cursor-not-allowed"
              style={{
                backgroundColor: '#1C1C28',
                border: '1px solid #3F3F50',
                color: '#52525B',
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub (requires credentials)
            </button>
          </div>
        )}

        <p className="text-center text-[12px] text-[#52525B] mt-4">
          By signing in, you agree to not be a bad actor.
        </p>
      </motion.div>
    </main>
  )
}
