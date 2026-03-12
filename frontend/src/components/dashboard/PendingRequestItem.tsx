import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { PendingRequest } from '@/app/dashboard/page'
import { Button } from '@/components/ui/button'

export default function PendingRequestItem({
  request,
  onAction,
}: {
  request: PendingRequest
  onAction: (id: string, status: 'approved' | 'rejected') => void
}) {
  const [acting, setActing] = useState(false)

  const handle = async (status: 'approved' | 'rejected') => {
    setActing(true)
    await onAction(request.id, status)
    setActing(false)
  }

  const requesterHandle =
    typeof request.requester_handle_obj === 'object'
      ? request.requester_handle_obj?.handle
      : request.requester_handle

  return (
    <div
      className="rounded-lg border border-border/70 bg-muted/40 p-4"
      data-testid="pending-request-item"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] font-semibold text-primary truncate"
            style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
          >
            @{requesterHandle || 'unknown'}
          </p>
          {request.message && (
            <p className="text-[13px] text-muted-foreground mt-1 line-clamp-2">{request.message}</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={() => handle('approved')}
            disabled={acting}
            data-testid="approve-btn"
            variant="outline"
            size="icon"
            className="h-8 w-8 border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => handle('rejected')}
            disabled={acting}
            data-testid="reject-btn"
            variant="outline"
            size="icon"
            className="h-8 w-8 border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
