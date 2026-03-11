import { z } from 'zod'

export const HANDLE_REGEX = /^[a-z0-9_]{2,24}$/

export const RESERVED_HANDLES = new Set([
  'admin', 'api', 'resolve', 'verify', 'support',
  'clawme', 'help', 'root', 'www', 'well-known',
])

// --- Zod Schemas ---

export const handleSchema = z
  .string()
  .min(2)
  .max(24)
  .regex(HANDLE_REGEX, 'Handles can only contain letters, numbers, and underscores')
  .toLowerCase()
  .refine((h) => !RESERVED_HANDLES.has(h), { message: 'This handle is reserved' })

export const waitlistSchema = z.object({
  email: z.string().email('Invalid email format'),
  desired_handle: handleSchema.optional().or(z.literal('')),
  source: z.string().optional().default('landing_page'),
})

export const claimHandleSchema = z.object({
  handle: handleSchema,
})

export const updateHandleSchema = z.object({
  display_name: z.string().max(50).optional(),
  description: z.string().max(280).optional(),
  target_gateway: z.string().url('Invalid URL format').startsWith('https://').or(z.string().url().startsWith('wss://')).optional(),
  public_key: z.string().optional(),
  supported_methods: z.array(z.string()).optional(),
  visibility_tier: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  auto_approve_rules: z.record(z.any()).optional(),
})

export const heartbeatSchema = z.object({
  gateway: z.string().url('Invalid URL format').refine(
    (url) => url.startsWith('https://') || url.startsWith('wss://'),
    'Gateway must use https:// or wss://'
  ),
})

export const connectionRequestSchema = z.object({
  target_handle: handleSchema,
  message: z.string().max(500).optional(),
})

export const resolveConnectionSchema = z.object({
  status: z.enum(['approved', 'rejected', 'blocked']),
})

// --- Legacy Helpers (Refactored to use Zod) ---

export function validateHandle(handle: string): { valid: boolean; error?: string } {
  const result = handleSchema.safeParse(handle)
  if (!result.success) {
    return { valid: false, error: result.error.errors[0].message }
  }
  return { valid: true }
}

export function validateEmail(email: string): boolean {
  return z.string().email().safeParse(email).success
}
