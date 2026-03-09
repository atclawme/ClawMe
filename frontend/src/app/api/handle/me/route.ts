import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserHandle } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return auth.error

  const { user } = auth
  const handle = await getUserHandle(user.id)
  if (!handle) return NextResponse.json({ error: 'No handle registered' }, { status: 404 })
  return NextResponse.json(handle)
}
