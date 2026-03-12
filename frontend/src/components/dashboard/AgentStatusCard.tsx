import TunnelWarning from './TunnelWarning'
import type { HandleData } from '@/app/dashboard/page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function getStatus(lastHeartbeat?: string): { label: string; color: string } {
  if (!lastHeartbeat) return { label: 'Offline', color: '#EF4444' }
  const diff = Date.now() - new Date(lastHeartbeat).getTime()
  const min = diff / 60000
  if (min < 15) return { label: 'Online', color: '#22C55E' }
  if (min < 60) return { label: 'Stale', color: '#F59E0B' }
  return { label: 'Offline', color: '#EF4444' }
}

function formatTs(ts?: string) {
  if (!ts) return 'Never'
  return new Date(ts).toLocaleString()
}

export default function AgentStatusCard({ handle }: { handle: HandleData | null }) {
  if (!handle) return null

  const status = getStatus(handle.last_heartbeat)
  const showTunnelWarning =
    !handle.target_gateway ||
    /^https?:\/\/\d+\.\d+\.\d+\.\d+/.test(handle.target_gateway) ||
    handle.target_gateway.startsWith('http://')

  return (
    <Card
      data-testid="agent-status-card"
      className="bg-gradient-to-b from-background/80 to-background/40 border-border/80 shadow-lg shadow-primary/5"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Agent Status
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {showTunnelWarning && <TunnelWarning />}

        <div className="space-y-4">
          <div>
            <p className="text-[11px] uppercase text-muted-foreground mb-1 tracking-[0.2em]">Gateway URL</p>
            <p
              className="text-[13px] break-all"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
              data-testid="gateway-url-display"
            >
              {handle.target_gateway || 'Not configured'}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase text-muted-foreground mb-1 tracking-[0.2em]">Last heartbeat</p>
            <p className="text-[13px] text-muted-foreground">{formatTs(handle.last_heartbeat)}</p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: status.color }}
            />
            <span
              className="text-[14px] font-medium"
              style={{ color: status.color }}
              data-testid="agent-status-label"
            >
              {status.label}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
