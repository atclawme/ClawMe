export const HANDLE_REGEX = /^[a-z0-9_]{2,24}$/

export const RESERVED_HANDLES = new Set([
  'admin',
  'api',
  'resolve',
  'verify',
  'support',
  'clawme',
  'help',
  'root',
  'www',
])

export function validateHandle(handle: string): { valid: boolean; error?: string } {
  if (!handle) return { valid: false }
  if (!HANDLE_REGEX.test(handle)) {
    return {
      valid: false,
      error: 'Handles can only contain letters, numbers, and underscores (2–24 characters)',
    }
  }
  if (RESERVED_HANDLES.has(handle)) {
    return { valid: false, error: 'This handle is reserved' }
  }
  return { valid: true }
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
