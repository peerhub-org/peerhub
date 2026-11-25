import { createLogger, type Logger } from '../../src/infrastructure/shared/observability/logging.ts'

/** Production-format logger that keeps its lines in memory. */
export function memoryLogger(): { logger: Logger; lines: Record<string, unknown>[] } {
  const lines: Record<string, unknown>[] = []
  const logger = createLogger(
    { ENVIRONMENT: 'production' },
    { write: (line) => void lines.push(JSON.parse(line) as Record<string, unknown>) },
  )
  return { logger, lines }
}
