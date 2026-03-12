import Link from 'next/link'
import type { HandleData } from '@/app/dashboard/page'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const TIERS: Record<number, { label: string; desc: string }> = {
  1: { label: 'Public (Tier 1)', desc: 'Anyone can see your name, description, and methods. Gateway is never exposed.' },
  2: { label: 'Connections Only (Tier 2)', desc: 'Only approved connections receive your full Agent Card.' },
  3: { label: 'Approval Required (Tier 3)', desc: 'Unknown agents see a partial card and a request URL. You approve each connection manually.' },
}

export default function VisibilityCard({ handle }: { handle: HandleData | null }) {
  if (!handle) return null

  const tier = TIERS[handle.visibility_tier] || TIERS[1]

  return (
    <Card
      data-testid="visibility-card"
      className="bg-gradient-to-b from-background/80 to-background/40 border-border/80 shadow-lg shadow-primary/5"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Visibility
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div
          className="rounded-lg border border-primary/40 bg-primary/10 p-4"
          data-testid="visibility-tier-display"
        >
          <p className="text-[14px] font-semibold text-primary mb-1">{tier.label}</p>
          <CardDescription className="text-[13px] leading-relaxed">
            {tier.desc}
          </CardDescription>
        </div>

        <Link
          href="/dashboard/settings"
          className="text-[12px] font-medium text-primary hover:text-primary/90 transition-colors"
        >
          Change in Settings
        </Link>
      </CardContent>
    </Card>
  )
}
