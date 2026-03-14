'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import HandleCard from '@/components/dashboard/HandleCard'
import AgentStatusCard from '@/components/dashboard/AgentStatusCard'
import ConnectionsCard from '@/components/dashboard/ConnectionsCard'
import { createClient } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export type HandleData = {
  id: string
  handle: string
  display_name?: string
  target_gateway?: string
  last_heartbeat?: string
  visibility_tier: number
  supported_methods?: string[]
  description?: string
  public_key?: string
  auto_approve_rules?: Record<string, unknown>
}

export type PendingRequest = {
  id: string
  requester_handle?: string
  display_name?: string
  description?: string
  message?: string
  created_at: string
  requester_handle_obj?: { handle: string; display_name?: string; description?: string }
}

export default function DashboardPage() {
  const router = useRouter()
  const [handleData, setHandleData] = useState<HandleData | null>(null)
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [approvedCount, setApprovedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  const refresh = async () => {
    try {
      const [handleRes, pendingRes] = await Promise.all([
        fetch('/api/handle/me', { credentials: 'include' }),
        fetch('/api/connections/pending', { credentials: 'include' }),
      ])

      if (handleRes.status === 401) { router.replace('/login'); return }
      if (handleRes.status === 404) { router.replace('/claim'); return }

      if (handleRes.ok) setHandleData(await handleRes.json())
      if (pendingRes.ok) {
        const { requests } = await pendingRes.json()
        setPendingRequests(requests || [])
      }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then((response) => {
      const user = response.data.user
      if (user?.email) setUserEmail(user.email)
    })
    refresh()
  }, [])

  const handleConnectionAction = async (id: string, status: 'approved' | 'rejected') => {
    await fetch(`/api/connections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    refresh()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-60 p-6 pt-[60px] md:pt-6">
        <div className="mx-auto max-w-[1000px] space-y-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h1
                className="text-[24px] font-semibold tracking-tight text-foreground"
                style={{ letterSpacing: '-0.02em' }}
              >
                Dashboard
              </h1>
              {userEmail && (
                <p className="text-[13px] text-muted-foreground">
                  Signed in as <span className="font-medium">{userEmail}</span>
                </p>
              )}
            </div>
            {/* @ts-ignore */}
            <Alert className="border-primary/20 bg-primary/5 text-xs text-muted-foreground">
              {/* @ts-ignore */}
              <AlertDescription>
                ClawMe is in early access and some capabilities are still rolling out. Full functionality is coming soon.
              </AlertDescription>
            </Alert>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <HandleCard handle={handleData} />
            <AgentStatusCard handle={handleData} />
            <div className="lg:col-span-2">
              <ConnectionsCard
                handle={handleData}
                pendingRequests={pendingRequests}
                approvedCount={approvedCount}
                onAction={handleConnectionAction}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
