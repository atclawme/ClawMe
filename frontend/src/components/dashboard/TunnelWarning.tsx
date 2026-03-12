import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export default function TunnelWarning() {
  return (
    <Alert
      variant="default"
      className="mb-4 border-amber-500/40 bg-amber-500/5 text-amber-200"
      data-testid="tunnel-warning"
    >
      <AlertTriangle className="h-4 w-4" />
      <div>
        <AlertTitle className="text-[12px] font-semibold tracking-wide uppercase text-amber-200">
          Agent not using a tunnel URL
        </AlertTitle>
        <AlertDescription className="text-[12px] leading-relaxed text-amber-100/90">
          Approved connections may see your real IP. Set up Cloudflare Tunnel or Tailscale Funnel and update your
          gateway URL in Settings.
        </AlertDescription>
      </div>
    </Alert>
  )
}
