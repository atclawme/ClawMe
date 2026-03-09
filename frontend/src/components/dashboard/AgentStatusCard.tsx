import TunnelWarning from './TunnelWarning'
import type { HandleData } from '@/app/dashboard/page'

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
    <div className="rounded-xl p-6" style={{ backgroundColor: '#13131A', border: '1px solid #27272F' }} data-testid="agent-status-card">
      <p className="text-[13px] font-medium uppercase text-[#8E8EA0] mb-4" style={{ letterSpacing: '0.05em' }}>
        Agent Status
      </p>

      {showTunnelWarning && <TunnelWarning />}

      <div className="space-y-4">
        <div>
          <p className="text-[12px] uppercase text-[#52525B] mb-1" style={{ letterSpacing: '0.05em' }}>Gateway URL</p>
          <p
            className="text-[14px] break-all"
            style={{
              fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              color: handle.target_gateway ? '#F0F0F5' : '#52525B',
            }}
            data-testid="gateway-url-display"
          >
            {handle.target_gateway || 'Not configured'}
          </p>
        </div>

        <div>
          <p className="text-[12px] uppercase text-[#52525B] mb-1" style={{ letterSpacing: '0.05em' }}>Last heartbeat</p>
          <p className="text-[14px] text-[#8E8EA0]">{formatTs(handle.last_heartbeat)}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: status.color }} />
          <span className="text-[14px] font-medium" style={{ color: status.color }} data-testid="agent-status-label">
            {status.label}
          </span>
        </div>
      </div>
    </div>
  )
}
