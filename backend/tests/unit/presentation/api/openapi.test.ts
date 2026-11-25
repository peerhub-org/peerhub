import { describe, expect, test } from 'vitest'
import type { Db } from 'mongodb'
import { createContainer } from '../../../../src/presentation/api/container.ts'
import { createOpenApi } from '../../../../src/presentation/api/openapi.ts'
import { createRoutes } from '../../../../src/presentation/api/routes.ts'
import { loadSettings } from '../../../../src/infrastructure/shared/config/config.ts'
import { openapi as python, type Operation, type Schema } from '../../../helpers/contract.ts'
import { memoryLogger } from '../../../helpers/logger.ts'

const settings = loadSettings({ ENVIRONMENT: 'test' }, null)
const container = createContainer({
  settings,
  db: { collection: () => ({}) } as unknown as Db,
  logger: memoryLogger().logger,
  posthog: null,
})
const routes = createRoutes(container)
const document = createOpenApi(routes, 'peerhub') as unknown as typeof python

/** Parameters reduced to what clients depend on. */
const parametersOf = (operation: Operation) =>
  (operation.parameters ?? []).map(({ name, in: place, required, schema }) => {
    // Python: "anyOf string or null". Here: an optional string.
    const { type = 'string', default: fallback, minimum, maximum } = schema
    return { name, place, required, type, fallback, minimum, maximum, options: schema.enum }
  })

const operations = Object.entries(python.paths).flatMap(([path, methods]) =>
  Object.entries(methods).map(([method, operation]) => ({ path, method, operation })),
)

test('has the same operations as the Python backend', () => {
  const list = (paths: typeof python.paths) =>
    Object.entries(paths)
      .flatMap(([path, methods]) => Object.keys(methods).map((method) => `${method} ${path}`))
      .sort()
  expect(list(document.paths)).toEqual(list(python.paths))
})

describe.each(operations)('$method $path', ({ path, method, operation }) => {
  const ours = document.paths[path]![method]!

  test('has the same parameters', () => {
    expect(parametersOf(ours)).toEqual(parametersOf(operation))
  })

  test('has the same body, success status and protection', () => {
    expect(ours.requestBody !== undefined).toBe(operation.requestBody !== undefined)
    const success = (o: Operation) => Object.keys(o.responses).filter((s) => s.startsWith('2'))
    expect(success(ours)).toEqual(success(operation))
    expect(ours.security !== undefined).toBe(operation.security !== undefined)
  })
})

describe('schemas', () => {
  const fieldsOf = (schema: Schema) => Object.keys(schema.properties ?? {}).sort()

  test.each(
    Object.entries(python.components.schemas).filter(
      ([name]) => !['HTTPValidationError', 'ValidationError'].includes(name),
    ),
  )('%s has the same fields', (name, schema) => {
    const ours = document.components.schemas[name]
    expect(ours).toBeDefined()
    expect(fieldsOf(ours!)).toEqual(fieldsOf(schema))
    expect(ours!.enum).toEqual(schema.enum)
    if (name.endsWith('Request')) expect(ours!.required).toEqual(schema.required)
  })
})

test('every reference resolves', () => {
  const refs = [...JSON.stringify(document).matchAll(/"#\/([^"]+)"/g)].map(([, ref]) => ref!)
  expect(refs.length).toBeGreaterThan(0)
  for (const ref of refs) {
    const [components, schemas, name] = ref.split('/')
    expect([components, schemas]).toEqual(['components', 'schemas'])
    expect(document.components.schemas).toHaveProperty([name!])
  }
})
