import { z } from 'zod'
import { readVersion } from '../../../../infrastructure/shared/config/version.ts'
import { namedLogger } from '../../../../infrastructure/shared/observability/logging.ts'
import type { Container } from '../../container.ts'
import { publicEndpoint, type Endpoint } from '../../endpoint.ts'

const healthResponse = z.record(z.string(), z.string())

export function healthEndpoints({ logger, pingDatabase }: Container): Endpoint[] {
  const log = namedLogger(logger, 'health')
  const version = readVersion()

  return [
    publicEndpoint({
      method: 'GET',
      path: '/health',
      tag: 'health',
      summary: 'Health check endpoint with database connectivity verification.',
      response: healthResponse,
      async handler() {
        let database = 'healthy'
        try {
          await pingDatabase()
        } catch {
          log.warn('Database health check failed')
          database = 'unhealthy'
        }
        const status = database === 'healthy' ? 'healthy' : 'degraded'
        log.info(`Health check: status=${status}, database=${database}`)
        return { status, database, version }
      },
    }),
  ]
}
