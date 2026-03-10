'use client'
import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const SUPABASE_READY =
  SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('placeholder')

// Mock user for development mode
const MOCK_USER = {
  id: 'mock-user-dev',
  email: 'dev@mock.local',
  app_metadata: {},
  user_metadata: { name: 'Mock Developer' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
}

// Check if mock session is active (stored in localStorage)
function isMockSessionActive(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('clawme_mock_session') === 'true'
}

export function setMockSession(active: boolean) {
  if (typeof window === 'undefined') return
  if (active) {
    localStorage.setItem('clawme_mock_session', 'true')
  } else {
    localStorage.removeItem('clawme_mock_session')
  }
}

export function createClient() {
  if (!SUPABASE_READY) {
    // Return a mock client when Supabase is not configured
    return {
      auth: {
        getUser: async () => {
          if (isMockSessionActive()) {
            return { data: { user: MOCK_USER }, error: null }
          }
          return { data: { user: null }, error: null }
        },
        signInWithOAuth: async () => ({ error: new Error('Supabase not configured - use Mock Login') }),
        signOut: async () => {
          setMockSession(false)
        },
        onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
          // Check initial state
          if (isMockSessionActive()) {
            setTimeout(() => callback('SIGNED_IN', { user: MOCK_USER }), 0)
          }
          return { data: { subscription: { unsubscribe: () => {} } } }
        },
      },
    } as unknown as ReturnType<typeof createBrowserClient>
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
