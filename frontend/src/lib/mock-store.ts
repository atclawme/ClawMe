// Shared in-memory mock stores
// Uses global to survive Next.js hot reloads

export type WaitlistEntry = {
  id: string
  email: string
  desired_handle?: string
  source?: string
  created_at: string
}

export type Handle = {
  id: string
  handle: string
  display_name?: string
  owner_id: string
  target_gateway?: string
  public_key?: string
  supported_methods?: string[]
  description?: string
  visibility_tier: number
  auto_approve_rules?: Record<string, unknown>
  trust_score: number
  created_at: string
  last_heartbeat?: string
}

export type Connection = {
  id: string
  requester_handle_id: string
  target_handle_id: string
  status: 'pending' | 'approved' | 'rejected' | 'blocked'
  requester_message?: string
  created_at: string
  resolved_at?: string
}

declare global {
  var __clawStore: {
    waitlist: Map<string, WaitlistEntry>
    waitlistByEmail: Map<string, string>
    waitlistByHandle: Map<string, string>
    handles: Map<string, Handle>
    handlesByOwner: Map<string, string>
    handlesBySlug: Map<string, string>
    connections: Map<string, Connection>
    rateLimits: Map<string, number[]>
  }
}

if (!global.__clawStore) {
  global.__clawStore = {
    waitlist: new Map(),
    waitlistByEmail: new Map(),
    waitlistByHandle: new Map(),
    handles: new Map(),
    handlesByOwner: new Map(),
    handlesBySlug: new Map(),
    connections: new Map(),
    rateLimits: new Map(),
  }
}

export const store = global.__clawStore

export function checkRateLimit(ip: string, maxReq = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const requests = (store.rateLimits.get(ip) || []).filter((t) => now - t < windowMs)
  if (requests.length >= maxReq) return false
  requests.push(now)
  store.rateLimits.set(ip, requests)
  return true
}

export const MOCK_USER_ID = 'mock-user-dev'
