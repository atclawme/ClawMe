import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserHandle } from '@/lib/auth'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'
import { store } from '@/lib/mock-store'
import { claimHandleSchema, updateHandleSchema } from '@/lib/validations'
import { apiError, apiValidationError } from '@/lib/api-response'

/**
 * POST /api/handle — Claim a handle
 * 
 * Validates:
 * 1. Handle format is valid
 * 2. Handle is not system-reserved
 * 3. User doesn't already have a handle
 * 4. Handle is not already claimed (active)
 * 5. Handle is not reserved on waitlist by a DIFFERENT email
 *    - If reserved by same email, allow the claim
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return auth.error

  const { user } = auth
  const body = await request.json().catch(() => ({}))
  const result = claimHandleSchema.safeParse(body)

  if (!result.success) {
    return apiValidationError(result.error)
  }

  const { handle } = result.data

  // Check if user already has a handle
  const existing = await getUserHandle(user.id)
  if (existing) return apiError(409, 'handle_already_claimed', 'Handle already claimed')

  const userEmail = user.email?.toLowerCase()

  if (!SUPABASE_CONFIGURED) {
    // Mock mode
    
    // Check if handle is already claimed (active)
    if (store.handlesBySlug.has(handle)) {
      return apiError(409, 'handle_taken', 'Handle is already claimed')
    }
    
    // Check if handle is reserved on waitlist by someone else
    const waitlistId = store.waitlistByHandle.get(handle)
    if (waitlistId) {
      const reservation = store.waitlist.get(waitlistId)
      if (reservation && reservation.email !== userEmail) {
        return apiError(
          409,
          'handle_reserved',
          'This handle is reserved by another user on the waitlist'
        )
      }
    }
    
    // Create the handle
    const id = crypto.randomUUID()
    const newHandle = {
      id,
      handle,
      owner_id: user.id,
      visibility_tier: 3,
      trust_score: 0,
      created_at: new Date().toISOString(),
    }
    store.handles.set(id, newHandle)
    store.handlesByOwner.set(user.id, id)
    store.handlesBySlug.set(handle, id)
    return NextResponse.json(newHandle, { status: 201 })
  }

  // Production mode with Supabase
  const supabase = createServiceSupabase()
  
  // Check if handle is already claimed
  const { data: taken } = await supabase
    .from('handles')
    .select('id')
    .eq('handle', handle)
    .maybeSingle()
  
  if (taken) {
    return apiError(409, 'handle_taken', 'Handle is already claimed')
  }

  // Check if handle is reserved on waitlist by someone else
  const { data: reservation } = await supabase
    .from('waitlist')
    .select('id, email')
    .ilike('desired_handle', handle)
    .maybeSingle()
  
  if (reservation && reservation.email.toLowerCase() !== userEmail) {
    return apiError(
      409,
      'handle_reserved',
      'This handle is reserved by another user on the waitlist'
    )
  }

  // Create the handle
  const { data, error } = await supabase
    .from('handles')
    .insert({ handle, owner_id: user.id, visibility_tier: 3, trust_score: 0 })
    .select()
    .single()

  if (error) return apiError(500, 'handle_claim_failed', 'Failed to claim handle')
  return NextResponse.json(data, { status: 201 })
}

/**
 * PUT /api/handle — Update handle settings
 */
export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return auth.error

  const { user } = auth
  const body = await request.json().catch(() => ({}))
  const result = updateHandleSchema.safeParse(body)

  if (!result.success) {
    return apiValidationError(result.error)
  }

  const updates = result.data

  if (!SUPABASE_CONFIGURED) {
    const handleId = store.handlesByOwner.get(user.id)
    if (!handleId) return apiError(404, 'handle_not_found', 'No handle found')
    const current = store.handles.get(handleId)!
    const updated = { ...current, ...updates }
    store.handles.set(handleId, updated)
    return NextResponse.json(updated)
  }

  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('handles')
    .update(updates)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) return apiError(500, 'handle_update_failed', 'Update failed')
  return NextResponse.json(data)
}
