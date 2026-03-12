import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserHandle } from '@/lib/auth'
import { apiError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return auth.error

  const { user } = auth
  const handle = await getUserHandle(user.id)
  if (!handle) return apiError(404, 'handle_not_found', 'No handle registered')
  return NextResponse.json(handle)
}
