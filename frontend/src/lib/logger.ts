import pino from 'pino'

const level =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

export const logger = pino({
  level,
  base: {
    service: 'clawme',
    env: process.env.NODE_ENV,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-supabase-auth"]',
      'authorization',
      'cookie',
    ],
    remove: true,
  },
})

export function errToLogObject(err: unknown) {
  if (err instanceof Error) {
    return {
      type: err.name,
      message: err.message,
      stack: err.stack,
      cause: err.cause instanceof Error ? err.cause.message : err.cause,
    }
  }
  return { message: String(err) }
}

