import { NextResponse } from 'next/server'
import type { z } from 'zod'

export type ApiErrorBody = {
  error: string
  message?: string
  details?: unknown
}

export function apiError(
  status: number,
  error: string,
  message?: string,
  details?: unknown
) {
  const body: ApiErrorBody = { error }
  if (message) body.message = message
  if (details !== undefined) body.details = details
  return NextResponse.json(body, { status })
}

export function apiValidationError(
  zodError: z.ZodError,
  status = 422,
  error = 'validation_failed'
) {
  return apiError(
    status,
    error,
    'Validation failed',
    zodError.errors.map((e) => ({ path: e.path, message: e.message }))
  )
}

