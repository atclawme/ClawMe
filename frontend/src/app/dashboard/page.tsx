'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import HandleCard from '@/components/dashboard/HandleCard'
import AgentStatusCard from '@/components/dashboard/AgentStatusCard'
import ConnectionsCard from '@/components/dashboard/ConnectionsCard'
import VisibilityCard from '@/components/dashboard/VisibilityCard'
import { createClient } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

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
    supabase.auth.getUser().then(({ data: { user } }) => {
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
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <Loader2 className="w-6 h-6 animate-spin text-[#6C47FF]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      <Sidebar />
      <main className="flex-1 md:ml-[240px] p-6 pt-[60px] md:pt-6">
        <div className="max-w-[1000px] mx-auto">
          <div className="mb-8">
            <h1 className="text-[24px] font-bold text-[#F0F0F5]" style={{ letterSpacing: '-0.01em' }}>
              Dashboard
            </h1>
            {userEmail && <p className="text-[13px] text-[#52525B] mt-1">{userEmail}</p>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <HandleCard handle={handleData} />
            <AgentStatusCard handle={handleData} />
            <ConnectionsCard
              handle={handleData}
              pendingRequests={pendingRequests}
              approvedCount={approvedCount}
              onAction={handleConnectionAction}
            />
            <VisibilityCard handle={handleData} />
          </div>
        </div>
      </main>
    </div>
  )
}
