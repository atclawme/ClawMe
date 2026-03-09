import Link from 'next/link'
import type { HandleData } from '@/app/dashboard/page'
import { ExternalLink } from 'lucide-react'

export default function HandleCard({ handle }: { handle: HandleData | null }) {
  if (!handle) {
    return (
      <div className="rounded-xl p-6" style={{ backgroundColor: '#13131A', border: '1px solid #27272F' }}>
        <p className="text-[13px] text-[#52525B]">No handle registered</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: '#13131A', border: '1px solid #27272F' }} data-testid="handle-card">
      <p className="text-[13px] font-medium uppercase text-[#8E8EA0] mb-3" style={{ letterSpacing: '0.05em' }}>
        Identity
      </p>
      <p
        className="text-[32px] font-bold text-[#6C47FF] mb-3"
        style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace', letterSpacing: '-0.02em' }}
        data-testid="dashboard-handle"
      >
        @{handle.handle}
      </p>
      {handle.display_name && (
        <p className="text-[15px] text-[#F0F0F5] mb-3">{handle.display_name}</p>
      )}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-[#22C55E] flex-shrink-0" />
        <span className="text-[13px] text-[#22C55E]">Verified via GitHub</span>
      </div>
      <Link
        href={`/@${handle.handle}`}
        className="flex items-center gap-1.5 text-[13px] text-[#6C47FF] hover:text-[#7C5CFF] transition-colors"
        style={{ transitionDuration: '150ms' }}
        data-testid="view-profile-link"
      >
        View public profile
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
