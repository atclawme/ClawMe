import { NextResponse } from 'next/server'
import { store } from '@/lib/mock-store'
import { createServiceSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase-server'

export async function GET() {
  if (!SUPABASE_CONFIGURED) {
    return NextResponse.json({ count: store.waitlist.size })
  }

  const supabase = createServiceSupabase()
  const { count } = await supabase
    .from('waitlist')
    .select('id', { count: 'exact', head: true })
  return NextResponse.json({ count: count ?? 0 })
}
