import * as Sentry from '@sentry/node'
import { logger } from '../utils/logger'

export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0
    })
    logger.info('Sentry initialized')
  }
}

export { Sentry }
