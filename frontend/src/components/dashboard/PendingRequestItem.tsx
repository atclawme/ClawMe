import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { PendingRequest } from '@/app/dashboard/page'

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
      className="rounded-lg p-4"
      style={{ backgroundColor: '#1C1C28', border: '1px solid #27272F' }}
      data-testid="pending-request-item"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] font-semibold text-[#6C47FF] truncate"
            style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
          >
            @{requesterHandle || 'unknown'}
          </p>
          {request.message && (
            <p className="text-[13px] text-[#8E8EA0] mt-1 line-clamp-2">{request.message}</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => handle('approved')}
            disabled={acting}
            data-testid="approve-btn"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: '#22C55E20', border: '1px solid #22C55E40', color: '#22C55E' }}
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => handle('rejected')}
            disabled={acting}
            data-testid="reject-btn"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: '#EF444420', border: '1px solid #EF444440', color: '#EF4444' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
