import Link from 'next/link'
import type { HandleData } from '@/app/dashboard/page'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/90 transition-colors"
          data-testid="view-profile-link"
        >
          View public profile
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </CardContent>
    </Card>
  )
}
