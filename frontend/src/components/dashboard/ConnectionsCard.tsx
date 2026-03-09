import Link from 'next/link'
import PendingRequestItem from './PendingRequestItem'
import type { HandleData, PendingRequest } from '@/app/dashboard/page'

export default function ConnectionsCard({
  handle,
  pendingRequests,
  approvedCount,
  onAction,
}: {
  handle: HandleData | null
  pendingRequests: PendingRequest[]
  approvedCount: number
  onAction: (id: string, status: 'approved' | 'rejected') => void
}) {
  const shown = pendingRequests.slice(0, 3)
  const overflow = pendingRequests.length - 3

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: '#13131A', border: '1px solid #27272F' }} data-testid="connections-card">
      <p className="text-[13px] font-medium uppercase text-[#8E8EA0] mb-4" style={{ letterSpacing: '0.05em' }}>
        Connections
      </p>

      <div className="flex items-center gap-4 mb-5">
        <div>
          <p className="text-[28px] font-bold text-[#F0F0F5]">{approvedCount}</p>
          <p className="text-[12px] text-[#52525B]">Approved</p>
        </div>
        {pendingRequests.length > 0 && (
          <div>
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[13px] font-bold text-white"
              style={{ backgroundColor: '#6C47FF' }}
              data-testid="pending-count-badge"
            >
              {pendingRequests.length}
            </span>
            <p className="text-[12px] text-[#52525B] mt-1">Pending</p>
          </div>
        )}
      </div>

      {shown.length > 0 && (
        <div className="space-y-3 mb-4">
          {shown.map((req) => (
            <PendingRequestItem key={req.id} request={req} onAction={onAction} />
          ))}
          {overflow > 0 && (
            <p className="text-[13px] text-[#6C47FF] cursor-pointer">+{overflow} more requests</p>
          )}
        </div>
      )}

      {pendingRequests.length === 0 && (
        <p className="text-[13px] text-[#52525B] mb-4">No pending requests</p>
      )}
    </div>
  )
}
