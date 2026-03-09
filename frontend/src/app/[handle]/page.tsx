'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, ExternalLink } from 'lucide-react'
import RequestConnectionModal from '@/components/profile/RequestConnectionModal'
import Link from 'next/link'

type AgentCard = {
  id: string
  name: string
  description: string
  supportedMethods?: string[]
  verification?: { type: string }
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} minute${min > 1 ? 's' : ''} ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hour${hr > 1 ? 's' : ''} ago`
  return `${Math.floor(hr / 24)} days ago`
}

export default function PublicProfilePage() {
  const params = useParams()
  // Handle can come URL-encoded (%40 for @) or with @ prefix
  const rawHandle = decodeURIComponent(params?.handle as string || '')
    .replace(/^@/, '')
    .toLowerCase()
    .trim()

  const [card, setCard] = useState<AgentCard | null>(null)
  const [handleMeta, setHandleMeta] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFound] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!rawHandle) return
    fetch(`/api/resolve/${rawHandle}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return }
        const data = await res.json()
        setCard(data)
        setHandleMeta(data)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [rawHandle])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <div className="w-6 h-6 rounded-full border-2 border-[#6C47FF] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (notFoundState || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[#0A0A0F]">
        <div className="text-center">
          <p className="text-[48px] mb-4">404</p>
          <h1 className="text-[24px] font-bold text-[#F0F0F5] mb-3">This handle does not exist yet.</h1>
          <p className="text-[16px] text-[#8E8EA0] mb-8">
            <span
              className="text-[#6C47FF]"
              style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
            >
              @{rawHandle}
            </span>{' '}
            has not been registered on ClawMe.
          </p>
          <Link
            href="/#waitlist"
            className="px-6 py-3 rounded-lg text-sm font-semibold text-white inline-block"
            style={{ backgroundColor: '#6C47FF' }}
          >
            Reserve your @handle
          </Link>
        </div>
      </div>
    )
  }

  const lastHeartbeat = handleMeta?.last_heartbeat as string | undefined
  const isRecent = lastHeartbeat && (Date.now() - new Date(lastHeartbeat).getTime() < 24 * 60 * 60 * 1000)
  const methods = card.supportedMethods || []

  return (
    <main className="min-h-screen bg-[#0A0A0F]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center px-6"
        style={{ backgroundColor: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #27272F' }}>
        <div className="max-w-[1100px] mx-auto w-full flex items-center justify-between">
          <Link href="/">
            <span className="font-bold text-[20px] text-[#6C47FF]"
              style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}>ClawMe</span>
          </Link>
          <Link href="/login" className="px-4 py-2 text-sm font-semibold border border-[#3F3F50] rounded-lg text-[#F0F0F5] hover:border-[#6C47FF] hover:text-[#6C47FF] transition-colors">
            Sign in
          </Link>
        </div>
      </nav>

      <div className="pt-[100px] pb-20 px-6">
        <div className="max-w-[640px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {/* Handle */}
            <h1
              className="text-[40px] font-bold mb-2"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                color: '#6C47FF',
                letterSpacing: '-0.02em',
              }}
              data-testid="profile-handle"
            >
              @{rawHandle}
            </h1>

            {/* Display name */}
            {card.name && card.name !== rawHandle && (
              <h2 className="text-[24px] font-semibold text-[#F0F0F5] mb-3">{card.name}</h2>
            )}

            {/* Verified badge */}
            {card.verification && (
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                <span className="text-[13px] text-[#22C55E] font-medium">Verified via GitHub</span>
              </div>
            )}

            {/* Description */}
            {card.description && (
              <p className="text-[16px] text-[#8E8EA0] leading-[1.7] mb-6">{card.description}</p>
            )}

            {/* Methods */}
            {methods.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {methods.map((m) => (
                  <span key={m} className="px-3 py-1 rounded-full text-[12px] font-medium"
                    style={{ backgroundColor: '#6C47FF1A', border: '1px solid #6C47FF40', color: '#6C47FF' }}>
                    {m}
                  </span>
                ))}
              </div>
            )}

            {/* Last seen */}
            {isRecent && lastHeartbeat && (
              <div className="flex items-center gap-2 mb-8 text-[13px] text-[#8E8EA0]">
                <Clock className="w-4 h-4" />
                <span>Active {timeAgo(lastHeartbeat)}</span>
              </div>
            )}

            {/* CTA */}
            <motion.button
              onClick={() => setShowModal(true)}
              data-testid="request-connection-btn"
              className="w-full h-12 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors"
              style={{ backgroundColor: '#6C47FF', transitionDuration: '150ms' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Request Connection
            </motion.button>
          </motion.div>
        </div>
      </div>

      {showModal && (
        <RequestConnectionModal
          targetHandle={rawHandle}
          onClose={() => setShowModal(false)}
        />
      )}
    </main>
  )
}
