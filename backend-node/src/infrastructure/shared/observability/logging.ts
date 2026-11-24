import { pino, type DestinationStream, type Logger } from 'pino'
import { prettyFactory } from 'pino-pretty'
import type { Settings } from '../config/config.ts'

export type { Logger }

// Level names used by the Python backend, so that existing log queries keep working.
const LEVEL_NAMES: Record<string, string> = { warn: 'WARNING', fatal: 'CRITICAL' }

/**
 * Create the root logger: JSON lines in production, readable lines elsewhere.
 * Always log through namedLogger(), so that every line says where it comes from.
 */
export function createLogger(
  settings: Pick<Settings, 'ENVIRONMENT'>,
  destination: DestinationStream = pino.destination(1),
): Logger {
  const stream = settings.ENVIRONMENT === 'production' ? destination : readable(destination)
  return pino(
    {
      level: 'info',
      base: undefined,
      messageKey: 'message',
      errorKey: 'error',
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
      formatters: { level: (label) => ({ level: LEVEL_NAMES[label] ?? label.toUpperCase() }) },
    },
    stream,
  )
}

/** Synchronous, unlike pino-pretty's own stream: no line is lost on exit. */
function readable(destination: DestinationStream): DestinationStream {
  const format = prettyFactory({
    colorize: false,
    messageKey: 'message',
    timestampKey: 'timestamp',
    errorLikeObjectKeys: ['error'],
    ignore: 'level,logger,timestamp',
    messageFormat: '{timestamp} [{level}] {logger}: {message}',
  })
  return { write: (line) => destination.write(format(line)) }
}

/** Call on the root logger only: nested names would repeat the key in the JSON line. */
export function namedLogger(logger: Logger, name: string): Logger {
  return logger.child({ logger: name })
}
