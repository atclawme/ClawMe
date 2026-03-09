'use client'
import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const SUPABASE_READY =
  SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('placeholder')

export function createClient() {
  if (!SUPABASE_READY) {
    // Return a mock client when Supabase is not configured
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithOAuth: async () => ({ error: new Error('Supabase not configured') }),
        signOut: async () => {},
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    } as ReturnType<typeof createBrowserClient>
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
