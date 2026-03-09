import Link from 'next/link'
import type { HandleData } from '@/app/dashboard/page'

const TIERS: Record<number, { label: string; desc: string }> = {
  1: { label: 'Public (Tier 1)', desc: 'Anyone can see your name, description, and methods. Gateway is never exposed.' },
  2: { label: 'Connections Only (Tier 2)', desc: 'Only approved connections receive your full Agent Card.' },
  3: { label: 'Approval Required (Tier 3)', desc: 'Unknown agents see a partial card and a request URL. You approve each connection manually.' },
}

export default function VisibilityCard({ handle }: { handle: HandleData | null }) {
  if (!handle) return null

  const tier = TIERS[handle.visibility_tier] || TIERS[1]

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: '#13131A', border: '1px solid #27272F' }} data-testid="visibility-card">
      <p className="text-[13px] font-medium uppercase text-[#8E8EA0] mb-4" style={{ letterSpacing: '0.05em' }}>
        Visibility
      </p>

      <div
        className="rounded-lg p-4 mb-5"
        style={{ backgroundColor: '#6C47FF1A', border: '1px solid #6C47FF40' }}
        data-testid="visibility-tier-display"
      >
        <p className="text-[15px] font-semibold text-[#6C47FF] mb-1">{tier.label}</p>
        <p className="text-[13px] text-[#8E8EA0] leading-[1.6]">{tier.desc}</p>
      </div>

      <Link
        href="/dashboard/settings"
        className="text-[13px] text-[#6C47FF] hover:text-[#7C5CFF] transition-colors"
        style={{ transitionDuration: '150ms' }}
      >
        Change in Settings
      </Link>
    </div>
  )
}
