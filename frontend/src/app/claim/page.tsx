'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { validateHandle } from '@/lib/validations'

type AvailStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function ClaimPage() {
  const router = useRouter()
  const [handle, setHandle] = useState('')
  const [availability, setAvailability] = useState<AvailStatus>('idle')
  const [handleError, setHandleError] = useState('')
  const [loading, setLoading] = useState(false)
  const [prefillHint, setPrefillHint] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      // Check if already has handle
      const res = await fetch('/api/handle/me')
      if (res.ok) { router.replace('/dashboard'); return }
    }
    init()
  }, [router])

  const checkAvailability = useCallback(async (value: string) => {
    if (!value) { setAvailability('idle'); return }
    const v = validateHandle(value)
    if (!v.valid) { setAvailability('invalid'); setHandleError(v.error || 'Invalid'); return }
    setAvailability('checking'); setHandleError('')
    try {
      const res = await fetch(`/api/waitlist/check?handle=${encodeURIComponent(value)}`)
      const data = await res.json()
      // Also check handles table
      const handleRes = await fetch(`/api/resolve/${value}`)
      if (handleRes.ok) {
        setAvailability('taken')
      } else {
        setAvailability(data.available ? 'available' : 'taken')
      }
    } catch { setAvailability('idle') }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (handle) {
      debounceRef.current = setTimeout(() => checkAvailability(handle), 300)
    } else {
      setAvailability('idle'); setHandleError('')
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [handle, checkAvailability])

  const handleClaim = async () => {
    if (availability !== 'available' || !handle) return
    setLoading(true)
    try {
      const res = await fetch('/api/handle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle }),
      })
      if (res.ok) { router.push('/dashboard') }
      else {
        const data = await res.json()
        if (data.error === 'handle_taken') setAvailability('taken')
        setHandleError(data.error || 'Failed to claim handle')
      }
    } catch { setHandleError('Something went wrong') }
    finally { setLoading(false) }
  }

  const borderColor = availability === 'available' ? '#22C55E' : availability === 'taken' || availability === 'invalid' ? '#EF4444' : undefined

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[#0A0A0F]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full"
        style={{ maxWidth: '480px' }}
      >
        <div className="text-center mb-8">
          <span
            className="text-[22px] font-bold text-[#6C47FF] block mb-8"
            style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
          >
            ClawMe
          </span>
          <h1 className="text-[36px] font-bold text-[#F0F0F5] mb-3" style={{ letterSpacing: '-0.01em' }}>
            Claim your{' '}
            <span className="text-[#6C47FF]" style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}>
              @handle
            </span>
          </h1>
          <p className="text-[16px] text-[#8E8EA0] leading-[1.6]">
            Your handle is your agent&apos;s permanent identity on ClawMe.
          </p>
        </div>

        <div
          className="rounded-xl p-8"
          style={{ backgroundColor: '#13131A', border: '1px solid #27272F' }}
        >
          {prefillHint && (
            <p className="text-[13px] text-[#6C47FF] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6C47FF] inline-block" />
              We saved this for you from the waitlist
            </p>
          )}

          <div className="mb-5">
            <label className="block text-[13px] font-medium uppercase text-[#8E8EA0] mb-2" style={{ letterSpacing: '0.05em' }}>
              Your handle
            </label>
            <div className="relative flex items-center">
              <span
                className="absolute left-4 text-[#8E8EA0] text-base select-none z-10"
                style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
              >
                @
              </span>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="yourhandle"
                data-testid="claim-handle-input"
                autoFocus
                className="w-full h-12 rounded-lg pl-9 pr-10 text-[#F0F0F5] text-base placeholder-[#52525B] outline-none transition-colors"
                style={{
                  backgroundColor: '#1C1C28',
                  border: `1px solid ${borderColor || '#3F3F50'}`,
                  fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                  transitionDuration: '150ms',
                }}
                onFocus={(e) => { if (!borderColor) e.currentTarget.style.borderColor = '#6C47FF' }}
                onBlur={(e) => { if (!borderColor) e.currentTarget.style.borderColor = '#3F3F50' }}
              />
              {availability === 'checking' && <Loader2 className="absolute right-4 w-4 h-4 text-[#8E8EA0] animate-spin" />}
              {availability === 'available' && <CheckCircle2 className="absolute right-4 w-4 h-4" style={{ color: '#22C55E' }} />}
              {availability === 'taken' && <XCircle className="absolute right-4 w-4 h-4" style={{ color: '#EF4444' }} />}
            </div>
            <div className="min-h-[20px] mt-1.5">
              {availability === 'available' && (
                <p className="text-[13px] flex items-center gap-1.5" style={{ color: '#22C55E' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] inline-block" />
                  @{handle} is available
                </p>
              )}
              {availability === 'taken' && (
                <p className="text-[13px]" style={{ color: '#EF4444' }}>@{handle} is taken</p>
              )}
              {availability === 'invalid' && handleError && (
                <p className="text-[13px]" style={{ color: '#EF4444' }}>{handleError}</p>
              )}
            </div>
          </div>

          <motion.button
            onClick={handleClaim}
            disabled={loading || availability !== 'available'}
            data-testid="claim-submit-btn"
            className="w-full h-12 text-white font-semibold text-sm rounded-lg tracking-[0.01em] flex items-center justify-center transition-colors"
            style={{
              backgroundColor: '#6C47FF',
              opacity: loading || availability !== 'available' ? 0.5 : 1,
              cursor: loading || availability !== 'available' ? 'not-allowed' : 'pointer',
              transitionDuration: '150ms',
            }}
            whileHover={availability === 'available' ? { scale: 1.02 } : {}}
            whileTap={availability === 'available' ? { scale: 0.98 } : {}}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : handle ? `Claim @${handle}` : 'Claim my handle'}
          </motion.button>
        </div>
      </motion.div>
    </main>
  )
}
