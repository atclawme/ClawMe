import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserHandle } from '@/lib/auth'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'
import { store } from '@/lib/mock-store'
import { claimHandleSchema, updateHandleSchema } from '@/lib/validations'

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
    return NextResponse.json({ 
      error: 'validation_failed', 
      details: result.error.errors.map(e => ({ path: e.path, message: e.message })) 
    }, { status: 422 })
  }

  const { handle } = result.data

  // Check if user already has a handle
  const existing = await getUserHandle(user.id)
  if (existing) return NextResponse.json({ error: 'Handle already claimed' }, { status: 409 })

  const userEmail = user.email?.toLowerCase()

  if (!SUPABASE_CONFIGURED) {
    // Mock mode
    
    // Check if handle is already claimed (active)
    if (store.handlesBySlug.has(handle)) {
      return NextResponse.json({ error: 'handle_taken' }, { status: 409 })
    }
    
    // Check if handle is reserved on waitlist by someone else
    const waitlistId = store.waitlistByHandle.get(handle)
    if (waitlistId) {
      const reservation = store.waitlist.get(waitlistId)
      if (reservation && reservation.email !== userEmail) {
        return NextResponse.json({ 
          error: 'handle_reserved', 
          message: 'This handle is reserved by another user on the waitlist' 
        }, { status: 409 })
      }
    }
    
    // Create the handle
    const id = crypto.randomUUID()
    const newHandle = {
      id,
      handle,
      owner_id: user.id,
      visibility_tier: 1,
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
    return NextResponse.json({ error: 'handle_taken' }, { status: 409 })
  }

  // Check if handle is reserved on waitlist by someone else
  const { data: reservation } = await supabase
    .from('waitlist')
    .select('id, email')
    .ilike('desired_handle', handle)
    .maybeSingle()
  
  if (reservation && reservation.email.toLowerCase() !== userEmail) {
    return NextResponse.json({ 
      error: 'handle_reserved', 
      message: 'This handle is reserved by another user on the waitlist' 
    }, { status: 409 })
  }

  // Create the handle
  const { data, error } = await supabase
    .from('handles')
    .insert({ handle, owner_id: user.id, visibility_tier: 1, trust_score: 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to claim handle' }, { status: 500 })
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
    return NextResponse.json({ 
      error: 'validation_failed', 
      details: result.error.errors.map(e => ({ path: e.path, message: e.message })) 
    }, { status: 422 })
  }

  const updates = result.data

  if (!SUPABASE_CONFIGURED) {
    const handleId = store.handlesByOwner.get(user.id)
    if (!handleId) return NextResponse.json({ error: 'No handle found' }, { status: 404 })
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

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json(data)
}
