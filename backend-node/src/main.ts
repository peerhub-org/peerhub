import { loadSettings } from './infrastructure/shared/config/config.ts'
import { connectDatabase } from './infrastructure/shared/database/connection.ts'
import { createLogger, namedLogger } from './infrastructure/shared/observability/logging.ts'
import { createPostHog } from './infrastructure/shared/observability/posthog.ts'
import { createTelemetry } from './infrastructure/shared/observability/telemetry.ts'
import { createApp } from './presentation/api/app.ts'
import { createContainer } from './presentation/api/container.ts'
import { createRoutes } from './presentation/api/routes.ts'
import { startServer, stopServer } from './server.ts'

const PORT = 8000

const settings = loadSettings()
const telemetry = createTelemetry(settings)
const rootLogger = createLogger(settings, undefined, telemetry?.stream)
const logger = namedLogger(rootLogger, 'main')
const posthog = createPostHog(settings, logger)

const database = await connectDatabase(settings)
logger.info('Database connection established')

const container = createContainer({ settings, db: database.db, logger: rootLogger, posthog })
const app = createApp({
  settings,
  logger: rootLogger,
  routes: createRoutes(container),
  captureException: (error, properties) => posthog?.captureException(error, { properties }),
})
const server = await startServer(app, PORT)
logger.info(`Listening on port ${PORT}`)

/** Every step runs even if a previous one fails. */
async function shutdown(): Promise<void> {
  logger.info('Shutting down')
  const steps: [string, () => Promise<unknown> | undefined][] = [
    ['HTTP server', () => stopServer(server)],
    ['Database', () => database.close()],
    ['PostHog', () => posthog?.shutdown()],
    // Last, so that the lines above are exported.
    ['Telemetry', () => telemetry?.shutdown()],
  ]
  for (const [name, step] of steps)
    try {
      await step()
    } catch (error) {
      process.exitCode = 1
      logger.error({ error }, `${name} shutdown failed`)
    }
  logger.info('Shutdown completed')
}

let stopping = false
for (const signal of ['SIGTERM', 'SIGINT'] as const)
  process.on(signal, () => {
    if (stopping) return
    stopping = true
    void shutdown()
  })
