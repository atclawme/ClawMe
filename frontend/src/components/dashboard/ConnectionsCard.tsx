import Link from 'next/link'
import PendingRequestItem from './PendingRequestItem'
import type { HandleData, PendingRequest } from '@/app/dashboard/page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    <Card
      data-testid="connections-card"
      className="bg-gradient-to-b from-background/80 to-background/40 border-border/80 shadow-lg shadow-primary/5"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Connections
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-2xl font-semibold text-foreground">{approvedCount}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">Approved</p>
          </div>
          {pendingRequests.length > 0 && (
            <div className="space-y-1">
              <Badge
                data-testid="pending-count-badge"
                className="h-7 w-7 rounded-full p-0 flex items-center justify-center text-[11px] font-bold bg-primary text-primary-foreground"
              >
                {pendingRequests.length}
              </Badge>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">Pending</p>
            </div>
          )}
        </div>

        {shown.length > 0 && (
          <div className="space-y-3">
            {shown.map((req) => (
              <PendingRequestItem key={req.id} request={req} onAction={onAction} />
            ))}
            {overflow > 0 && (
              <p className="text-[12px] text-primary cursor-pointer">+{overflow} more requests</p>
            )}
          </div>
        )}

        {pendingRequests.length === 0 && (
          <p className="text-[12px] text-muted-foreground">No pending requests</p>
        )}
      </CardContent>
    </Card>
  )
}
