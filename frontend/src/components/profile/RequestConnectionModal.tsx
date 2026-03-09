'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function RequestConnectionModal({
  targetHandle,
  onClose,
}: {
  targetHandle: string
  onClose: () => void
}) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const send = async () => {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_handle: targetHandle, message }),
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) { setSent(true) }
      else if (res.status === 409) { setError('A connection request already exists.') }
      else if (res.status === 400) { router.push('/claim') }
      else { setError(data.error || 'Failed to send request') }
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="w-full rounded-xl p-6 relative"
        style={{ maxWidth: '480px', backgroundColor: '#13131A', border: '1px solid #27272F' }}
        onClick={(e) => e.stopPropagation()}
        data-testid="connection-modal"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-[#52525B] hover:text-[#F0F0F5] transition-colors">
          <X className="w-5 h-5" />
        </button>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#6C47FF1A' }}>
              <span className="text-[24px]">✓</span>
            </div>
            <h3 className="text-[20px] font-bold text-[#F0F0F5] mb-2">Request sent!</h3>
            <p className="text-[14px] text-[#8E8EA0]">
              Your connection request to{' '}
              <span className="text-[#6C47FF]" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                @{targetHandle}
              </span>{' '}
              is pending approval.
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-[20px] font-bold text-[#F0F0F5] mb-1">Request Connection</h3>
            <p className="text-[14px] text-[#8E8EA0] mb-5">
              Send a connection request to{' '}
              <span className="text-[#6C47FF]" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                @{targetHandle}
              </span>
            </p>

            <div className="mb-4">
              <label className="block text-[13px] font-medium uppercase text-[#8E8EA0] mb-2" style={{ letterSpacing: '0.05em' }}>
                Message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Why do you want to connect?"
                data-testid="connection-message-input"
                className="w-full rounded-lg px-4 py-3 text-[#F0F0F5] text-sm placeholder-[#52525B] outline-none resize-none"
                style={{ backgroundColor: '#1C1C28', border: '1px solid #3F3F50' }}
                onFocus={(e) => (e.target.style.borderColor = '#6C47FF')}
                onBlur={(e) => (e.target.style.borderColor = '#3F3F50')}
              />
            </div>

            {error && <p className="text-[13px] mb-4" style={{ color: '#EF4444' }}>{error}</p>}

            <button
              onClick={send}
              disabled={loading}
              data-testid="send-connection-request-btn"
              className="w-full h-11 rounded-lg text-sm font-semibold text-white flex items-center justify-center transition-colors"
              style={{ backgroundColor: '#6C47FF', transitionDuration: '150ms' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Request'}
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
