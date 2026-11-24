import { SeverityNumber, type Attributes } from '@opentelemetry/api'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto'
import {
  BatchLogRecordProcessor,
  LoggerProvider,
  type LogRecordProcessor,
} from '@opentelemetry/sdk-logs'
import type { DestinationStream } from 'pino'
import type { Settings } from '../config/config.ts'

const SEVERITY: Record<string, { number: SeverityNumber; text: string }> = {
  DEBUG: { number: SeverityNumber.DEBUG, text: 'DEBUG' },
  INFO: { number: SeverityNumber.INFO, text: 'INFO' },
  WARNING: { number: SeverityNumber.WARN, text: 'WARN' },
  ERROR: { number: SeverityNumber.ERROR, text: 'ERROR' },
  CRITICAL: { number: SeverityNumber.FATAL, text: 'FATAL' },
}

/** Loggers whose lines stay local: request lines are not exported. */
const LOCAL_LOGGERS = new Set(['access'])

interface LogLine {
  level: string
  timestamp: string
  logger: string
  message: string
  error?: { type?: string; message?: string; stack?: string }
}

export interface Telemetry {
  /** Receives the JSON lines of the logger. */
  stream: DestinationStream
  shutdown(): Promise<void>
}

/** Export logs to PostHog, or null when it is not configured. */
export function createTelemetry(
  settings: Pick<Settings, 'ENVIRONMENT' | 'POSTHOG_API_KEY' | 'POSTHOG_HOST'>,
): Telemetry | null {
  if (settings.ENVIRONMENT === 'test' || !settings.POSTHOG_API_KEY) return null
  const exporter = new OTLPLogExporter({
    url: `${settings.POSTHOG_HOST}/i/v1/logs`,
    headers: { Authorization: `Bearer ${settings.POSTHOG_API_KEY}` },
  })
  return telemetryFor(new BatchLogRecordProcessor({ exporter }))
}

export function telemetryFor(processor: LogRecordProcessor): Telemetry {
  const provider = new LoggerProvider({ processors: [processor] })
  return {
    stream: {
      write(text) {
        const line = JSON.parse(text) as LogLine
        if (LOCAL_LOGGERS.has(line.logger)) return
        const severity = SEVERITY[line.level]
        provider.getLogger(line.logger).emit({
          timestamp: new Date(line.timestamp),
          severityNumber: severity?.number,
          severityText: severity?.text ?? line.level,
          body: line.message,
          attributes: errorAttributes(line.error),
        })
      },
    },
    shutdown: () => provider.shutdown(),
  }
}

function errorAttributes(error: LogLine['error']): Attributes {
  if (!error) return {}
  return {
    'exception.type': error.type ?? 'Error',
    'exception.message': error.message ?? '',
    'exception.stacktrace': error.stack ?? '',
  }
}
