import { createServer, type IncomingMessage } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { SeverityNumber } from '@opentelemetry/api'
import { InMemoryLogRecordExporter, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { expect, test } from 'vitest'
import {
  createLogger,
  namedLogger,
} from '../../../../../src/infrastructure/shared/observability/logging.ts'
import { createPostHog } from '../../../../../src/infrastructure/shared/observability/posthog.ts'
import {
  createTelemetry,
  telemetryFor,
} from '../../../../../src/infrastructure/shared/observability/telemetry.ts'
import { memoryLogger } from '../../../../helpers/logger.ts'

function exportedBy(log: (root: ReturnType<typeof createLogger>) => void) {
  const exporter = new InMemoryLogRecordExporter()
  const telemetry = telemetryFor(new SimpleLogRecordProcessor({ exporter }))
  let output = ''
  const destination = { write: (text: string) => void (output += text) }
  log(createLogger({ ENVIRONMENT: 'development' }, destination, telemetry.stream))
  return { records: exporter.getFinishedLogRecords(), output }
}

test('lines are exported with logger, severity and time, and still printed', () => {
  const { records, output } = exportedBy((root) => namedLogger(root, 'github').warn('slow'))
  expect(records).toHaveLength(1)
  expect(records[0]).toMatchObject({
    body: 'slow',
    severityNumber: SeverityNumber.WARN,
    severityText: 'WARN',
    instrumentationScope: { name: 'github' },
    attributes: {},
  })
  expect(Math.abs(Date.now() / 1000 - records[0]!.hrTime[0])).toBeLessThan(5)
  expect(output).toContain('[WARNING] github: slow')
})

test('errors are exported as exception attributes', () => {
  const { records } = exportedBy((root) =>
    namedLogger(root, 'api').error({ error: new TypeError('boom') }, 'failed'),
  )
  expect(records[0]).toMatchObject({
    body: 'failed',
    severityNumber: SeverityNumber.ERROR,
    attributes: {
      'exception.type': 'TypeError',
      'exception.message': 'boom',
      'exception.stacktrace': expect.stringContaining('telemetry.test.ts'),
    },
  })
})

test('request lines are not exported', () => {
  const { records, output } = exportedBy((root) => namedLogger(root, 'access').info('GET /'))
  expect(records).toEqual([])
  expect(output).toContain('GET /')
})

const settings = {
  ENVIRONMENT: 'production',
  POSTHOG_API_KEY: 'phc_key',
  POSTHOG_HOST: 'http://127.0.0.1:1',
} as const

test.each([{ ENVIRONMENT: 'test' } as const, { POSTHOG_API_KEY: null }])(
  'PostHog is off with %j',
  (change) => {
    const { logger } = memoryLogger()
    expect(createTelemetry({ ...settings, ...change })).toBeNull()
    expect(createPostHog({ ...settings, ...change }, logger)).toBeNull()
  },
)

test('PostHog receives logs and exceptions before shutdown ends', async () => {
  const received: { url: string; headers: IncomingMessage['headers']; size: number }[] = []
  const server = createServer((req, res) => {
    let size = 0
    req.on('data', (chunk: Buffer) => (size += chunk.length))
    req.on('end', () => {
      received.push({ url: req.url!, headers: req.headers, size })
      res.setHeader('Content-Type', 'application/json').end('{}')
    })
  }).listen(0, '127.0.0.1')
  await once(server, 'listening')
  const local = {
    ...settings,
    POSTHOG_HOST: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
  }
  try {
    const { logger: quiet } = memoryLogger()
    const telemetry = createTelemetry(local)!
    const posthog = createPostHog(local, quiet)!
    namedLogger(createLogger(local, { write: () => {} }, telemetry.stream), 'main').info('hello')
    posthog.captureException(new Error('boom'), { properties: { path: '/x', method: 'GET' } })
    await posthog.shutdown()
    await telemetry.shutdown()
  } finally {
    server.closeAllConnections()
    server.close()
  }
  const logs = received.find((request) => request.url === '/i/v1/logs')
  expect(logs?.headers).toMatchObject({
    authorization: 'Bearer phc_key',
    'content-type': 'application/x-protobuf',
  })
  expect(logs?.size).toBeGreaterThan(0)
  expect(received.filter((request) => request.url !== '/i/v1/logs')).not.toEqual([])
})
