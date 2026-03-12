const pino = require('pino')

const level =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

const logger = pino({
  level,
  base: { service: 'clawme', env: process.env.NODE_ENV },
})

module.exports = { logger }

