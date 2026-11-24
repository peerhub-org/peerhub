import { loadSettings } from './infrastructure/shared/config/config.ts'
import { createLogger, namedLogger } from './infrastructure/shared/observability/logging.ts'
import { createApp } from './presentation/api/app.ts'
import { startServer, stopServer } from './server.ts'

const PORT = 8000

const settings = loadSettings()
const rootLogger = createLogger(settings)
const logger = namedLogger(rootLogger, 'main')
const app = createApp({ settings, logger: rootLogger, routes: [] })
const server = await startServer(app, PORT)
logger.info(`Listening on port ${PORT}`)

let stopping = false
async function shutdown(): Promise<void> {
  if (stopping) return
  stopping = true
  logger.info('Shutting down')
  await stopServer(server)
  logger.info('Shutdown completed')
}

for (const signal of ['SIGTERM', 'SIGINT'] as const)
  process.on(signal, () => {
    shutdown().catch((error: unknown) => {
      logger.error({ error }, 'Shutdown failed')
      process.exitCode = 1
    })
  })
