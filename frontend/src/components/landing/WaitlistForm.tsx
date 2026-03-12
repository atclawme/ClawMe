'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { validateHandle } from '@/lib/validations'
import { Input as _Input } from '@/components/ui/input'
import { Button as _Button } from '@/components/ui/button'
import WaitlistSurvey from './WaitlistSurvey'

const Input = _Input as React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
const Button = _Button as React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'rate_limited'

export default function WaitlistForm() {
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [availability, setAvailability] = useState<AvailabilityStatus>('idle')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successHandle, setSuccessHandle] = useState('')
  const [successEmail, setSuccessEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [handleError, setHandleError] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkAvailability = useCallback(async (value: string) => {
    if (!value) {
      setAvailability('idle')
      setHandleError('')
      return
    }
    const validation = validateHandle(value)
    if (!validation.valid) {
      setAvailability('invalid')
      setHandleError(validation.error || 'Invalid handle format')
      return
    }
    setAvailability('checking')
    setHandleError('')
    try {
      const res = await fetch(`/api/waitlist/check?handle=${encodeURIComponent(value)}`)
      if (res.status === 429) {
        setAvailability('rate_limited')
        return
      }
      const data = await res.json()
      setAvailability(data.available ? 'available' : 'taken')
    } catch {
      setAvailability('idle')
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (handle) {
      debounceRef.current = setTimeout(() => checkAvailability(handle), 600)
    } else {
      setAvailability('idle')
      setHandleError('')
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [handle, checkAvailability])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const handleSubmit = async () => {
    setEmailError('')
    setHandleError('')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }
    if (availability === 'taken') {
      setHandleError('@' + handle + ' is taken')
      return
    }
    if (availability === 'invalid' && handle) return

    setLoading(true)
    try {
      const body: Record<string, string> = { email, source: 'landing_page' }
      if (handle) body.desired_handle = handle

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (res.status === 409) {
        if (data.error === 'already_registered') {
          setEmailError('This email is already on the waitlist.')
        } else if (data.error === 'handle_taken') {
          setAvailability('taken')
          setHandleError('@' + handle + ' is taken')
        } else {
          showToast('Something went wrong. Please try again.')
        }
      } else if (res.ok) {
        setSuccessHandle(handle)
        setSuccessEmail(email)
        setSuccess(true)
      } else {
        showToast('Something went wrong. Please try again.')
      }
    } catch {
      showToast('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isSubmitDisabled =
    loading ||
    availability === 'taken' ||
    availability === 'invalid' ||
    availability === 'rate_limited' ||
    (handle !== '' && availability === 'checking')

  const borderColor = () => {
    if (availability === 'available') return '#22C55E'
    if (availability === 'taken' || availability === 'invalid') return '#EF4444'
    return undefined
  }

  return (
    <section
      id="waitlist"
      className="py-[120px] px-6"
      style={{ backgroundColor: '#13131A' }}
      data-testid="waitlist-section"
    >
      <div className="mx-auto" style={{ maxWidth: '560px' }}>
        {/* Header */}
        <div className="text-center mb-10">
          <p
            className="text-[13px] font-medium uppercase text-[#8E8EA0] mb-3"
            style={{ letterSpacing: '0.1em' }}
          >
            Early access
          </p>
          <h2
            className="text-[36px] font-bold text-[#F0F0F5] mb-4"
            style={{ letterSpacing: '-0.01em' }}
          >
            Reserve your{' '}
            <span style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace', color: '#6C47FF' }}>
              @handle
            </span>{' '}
            now.
          </h2>
          <p className="text-[16px] text-[#8E8EA0] leading-[1.7]">
            We&apos;re onboarding the first wave of @ClawMe users. Reserve your handle today, and it&apos;s
            yours when we launch.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="text-center py-8"
              data-testid="waitlist-success-state"
            >
              <CheckCircle className="w-14 h-14 mx-auto mb-5" style={{ color: '#6C47FF' }} />
              <h3 className="text-[28px] font-bold text-[#F0F0F5] mb-3">
                You&apos;re on the list.
              </h3>
              <p className="text-[16px] text-[#8E8EA0] leading-[1.7]">
                {successHandle && (
                  <>
                    <span
                      className="text-[#6C47FF]"
                      style={{
                        fontFamily:
                          'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                      }}
                    >
                      @{successHandle}
                    </span>{' '}
                    is reserved for you.{' '}
                  </>
                )}
                We&apos;ll email you at{' '}
                <span className="text-[#F0F0F5]">{successEmail}</span> when @ClawMe launches.
              </p>

              <WaitlistSurvey email={successEmail} />
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Handle Input */}
              <div>
                <label
                  htmlFor="handle-input"
                  className="block text-[13px] font-medium uppercase text-[#8E8EA0] mb-2"
                  style={{ letterSpacing: '0.05em' }}
                >
                  Your handle
                </label>
                <div className="relative flex items-center">
                  <span
                    className="absolute left-4 text-[#8E8EA0] text-base select-none z-10"
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    }}
                  >
                    @
                  </span>
                  <Input
                    id="handle-input"
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="yourhandle"
                    data-testid="handle-input"
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full h-12 rounded-lg pl-9 pr-10 text-[#F0F0F5] text-base placeholder-[#52525B] outline-none transition-colors border-0"
                    style={{
                      backgroundColor: '#1C1C28',
                      border: `1px solid ${borderColor() || '#3F3F50'}`,
                      transitionDuration: '150ms',
                      fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    }}
                    onFocus={(e) => {
                      if (!borderColor()) {
                        e.currentTarget.style.borderColor = '#6C47FF'
                      }
                    }}
                    onBlur={(e) => {
                      if (!borderColor()) {
                        e.currentTarget.style.borderColor = '#3F3F50'
                      }
                    }}
                  />
                  {/* Status icon */}
                  {availability === 'checking' && (
                    <Loader2 className="absolute right-4 w-4 h-4 text-[#8E8EA0] animate-spin" />
                  )}
                  {availability === 'available' && (
                    <CheckCircle2 className="absolute right-4 w-4 h-4" style={{ color: '#22C55E' }} />
                  )}
                  {(availability === 'taken') && (
                    <XCircle className="absolute right-4 w-4 h-4" style={{ color: '#EF4444' }} />
                  )}
                </div>
                {/* Availability feedback */}
                <div className="min-h-[20px] mt-1.5">
                  {availability === 'checking' && (
                    <p className="text-[13px] text-[#52525B]">Checking...</p>
                  )}
                  {availability === 'available' && handle && (
                    <p
                      className="text-[13px] flex items-center gap-1.5"
                      style={{ color: '#22C55E' }}
                      data-testid="handle-available-msg"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: '#22C55E' }}
                      />
                      @{handle} is available
                    </p>
                  )}
                  {availability === 'taken' && (
                    <p
                      className="text-[13px] flex items-center gap-1.5"
                      style={{ color: '#EF4444' }}
                      data-testid="handle-taken-msg"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: '#EF4444' }}
                      />
                      @{handle} is taken
                    </p>
                  )}
                  {availability === 'rate_limited' && (
                    <p
                      className="text-[13px] flex items-center gap-1.5"
                      style={{ color: '#F59E0B' }}
                      data-testid="handle-rate-limited-msg"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: '#F59E0B' }}
                      />
                      Too many checks — wait a moment
                    </p>
                  )}
                  {availability === 'invalid' && handleError && (
                    <p
                      className="text-[13px]"
                      style={{ color: '#EF4444' }}
                      data-testid="handle-invalid-msg"
                    >
                      {handleError}
                    </p>
                  )}
                  {handleError && availability !== 'invalid' && availability !== 'taken' && (
                    <p className="text-[13px]" style={{ color: '#EF4444' }}>
                      {handleError}
                    </p>
                  )}
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label
                  htmlFor="email-input"
                  className="block text-[13px] font-medium uppercase text-[#8E8EA0] mb-2"
                  style={{ letterSpacing: '0.05em' }}
                >
                  Email address
                </label>
                <Input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  data-testid="email-input"
                  className="w-full h-12 rounded-lg px-4 text-[#F0F0F5] text-base placeholder-[#52525B] outline-none transition-colors border-0"
                  style={{
                    backgroundColor: '#1C1C28',
                    border: '1px solid #3F3F50',
                    transitionDuration: '150ms',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#6C47FF'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#3F3F50'
                  }}
                />
                {emailError && (
                  <p
                    className="text-[13px] mt-1.5"
                    style={{ color: '#EF4444' }}
                    data-testid="email-error-msg"
                  >
                    {emailError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <motion.div
                whileHover={!isSubmitDisabled ? { scale: 1.02 } : {}}
                whileTap={!isSubmitDisabled ? { scale: 0.98 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-full"
              >
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitDisabled}
                  data-testid="waitlist-submit-btn"
                  className="w-full h-12 text-white font-semibold text-sm rounded-lg tracking-[0.01em] flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: isSubmitDisabled ? '#6C47FF80' : '#6C47FF',
                    transitionDuration: '150ms',
                    cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                    opacity: isSubmitDisabled ? 0.5 : 1,
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : handle ? (
                    `Reserve @${handle}`
                  ) : (
                    'Reserve my handle'
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-6 right-6 rounded-lg px-4 py-3 text-[14px] text-[#F0F0F5] shadow-xl z-50"
            style={{
              backgroundColor: '#1C1C28',
              border: '1px solid #3F3F50',
              maxWidth: '320px',
            }}
            data-testid="error-toast"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
