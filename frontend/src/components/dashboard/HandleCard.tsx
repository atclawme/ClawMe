import Link from 'next/link'
import type { HandleData } from '@/app/dashboard/page'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const VISIBILITY_TIERS: Record<number, { label: string; desc: string }> = {
  1: { label: 'Public (Tier 1)', desc: 'Anyone can see your name, description, and methods. Gateway is never exposed.' },
  2: { label: 'Connections Only (Tier 2)', desc: 'Only approved connections receive your full Agent Card.' },
  3: { label: 'Approval Required (Tier 3)', desc: 'Unknown agents see a partial card and a request URL. You approve each connection manually.' },
}

export default function HandleCard({ handle }: { handle: HandleData | null }) {
  if (!handle) {
    return (
      <Card data-testid="handle-card">
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground">No handle registered</p>
        </CardContent>
      </Card>
    )
  }

  const visibility = VISIBILITY_TIERS[handle.visibility_tier] || VISIBILITY_TIERS[1]

  return (
    <Card
      data-testid="handle-card"
      className="bg-gradient-to-b from-background/80 to-background/40 border-border/80 shadow-lg shadow-primary/5"
    >
      <CardHeader className="pb-4">
        <CardTitle className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Identity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div>
          <p
            className="text-3xl font-bold text-[#6C47FF] mb-1"
            style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace', letterSpacing: '-0.02em' }}
            data-testid="dashboard-handle"
          >
            @{handle.handle}
          </p>
          {handle.display_name && (
            <CardDescription className="text-sm text-foreground/90">{handle.display_name}</CardDescription>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]" />
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[11px] font-medium tracking-wide"
            >
              Verified via GitHub
            </Badge>
          </div>
          <Link
            href={`/@${handle.handle}`}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/90 transition-colors"
            data-testid="view-profile-link"
            target="_blank"
            rel="noreferrer noopener"
          >
            View public profile
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Visibility
          </p>
          <div
            className="rounded-lg border border-primary/40 bg-primary/10 p-3"
            data-testid="visibility-tier-display"
          >
            <p className="text-[13px] font-semibold text-primary mb-1">
              {visibility.label}
            </p>
            <CardDescription className="text-[12px] leading-relaxed">
              {visibility.desc}
            </CardDescription>
            <Link
              href="/dashboard/settings"
              className="mt-2 inline-flex text-[11px] font-medium text-primary hover:text-primary/90 transition-colors"
            >
              Change in Settings
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
