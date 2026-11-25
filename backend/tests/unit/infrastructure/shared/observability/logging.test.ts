import { expect, test } from 'vitest'
import {
  createLogger,
  namedLogger,
} from '../../../../../src/infrastructure/shared/observability/logging.ts'
import { memoryLogger } from '../../../../helpers/logger.ts'

test('production lines are JSON with the fields of the Python backend', () => {
  const { logger, lines } = memoryLogger()
  namedLogger(logger, 'github').warn('slow')
  expect(lines).toEqual([
    {
      timestamp: expect.stringMatching(/^\d{4}-\d\d-\d\dT[\d:.]+Z$/),
      level: 'WARNING',
      logger: 'github',
      message: 'slow',
    },
  ])
})

test('errors keep message and stack', () => {
  const { logger, lines } = memoryLogger()
  logger.error({ error: new Error('boom') }, 'failed')
  expect(lines[0]).toMatchObject({
    level: 'ERROR',
    message: 'failed',
    error: { message: 'boom', stack: expect.stringContaining('logging.test.ts') },
  })
})

test('debug is not logged', () => {
  const { logger, lines } = memoryLogger()
  logger.debug('noise')
  expect(lines).toEqual([])
})

test('other environments get readable lines', () => {
  let output = ''
  const logger = createLogger(
    { ENVIRONMENT: 'development' },
    { write: (text) => void (output += text) },
  )
  namedLogger(logger, 'main').info('ready')
  expect(output).toMatch(/^\S+Z \[INFO\] main: ready\n$/)
})
