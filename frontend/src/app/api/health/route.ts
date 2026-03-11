import { NextResponse } from 'next/server'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'
import { ratelimiter, redis } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic' // Ensure this isn't cached

/**
 * GET /api/health
 * 
 * Production health check for monitoring systems (UptimeRobot, K8s Liveness, etc.)
 * Checks: 
 * 1. API Responsiveness
 * 2. Supabase Connectivity (if configured)
 * 3. Redis Connectivity (if configured)
 */
export async function GET() {
  const checks: Record<string, any> = {
    "api:responsiveness": [{ status: "pass", componentType: "component" }]
  }

  let isHealthy = true

  // 1. Check Supabase
  if (SUPABASE_CONFIGURED) {
    try {
      const supabase = createServiceSupabase()
      const { error } = await supabase.from('waitlist').select('count', { count: 'exact', head: true })
      const status = error ? "fail" : "pass"
      if (error) isHealthy = false
      checks["database:supabase"] = [{ 
        status, 
        componentId: "supabase-postgresql",
        time: new Date().toISOString() 
      }]
    } catch (err) {
      isHealthy = false
      checks["database:supabase"] = [{ status: "fail", output: String(err) }]
    }
  }

  // 2. Check Redis (Upstash)
  if (redis) {
    try {
      const ok = await redis.ping()
      const status = ok === 'PONG' ? "pass" : "fail"
      if (ok !== 'PONG') isHealthy = false
      checks["cache:redis"] = [{ 
        status, 
        componentId: "upstash-redis",
        time: new Date().toISOString() 
      }]
    } catch (err) {
      isHealthy = false
      checks["cache:redis"] = [{ status: "fail", output: String(err) }]
    }
  }

  const response = {
    status: isHealthy ? "pass" : "fail",
    version: "1.0.0",
    releaseId: process.env.VERCEL_GIT_COMMIT_SHA || "local-dev",
    checks,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  }

  return new NextResponse(JSON.stringify(response), { 
    status: isHealthy ? 200 : 503,
    headers: {
      'Content-Type': 'application/health+json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    }
  })
}
