import { expect, test } from 'vitest'
import type { Db } from 'mongodb'
import { createContainer } from '../../../../src/presentation/api/container.ts'
import { createOpenApi } from '../../../../src/presentation/api/openapi.ts'
import { createRoutes } from '../../../../src/presentation/api/routes.ts'
import { loadSettings } from '../../../../src/infrastructure/shared/config/config.ts'
import { memoryLogger } from '../../../helpers/logger.ts'

const settings = loadSettings({ ENVIRONMENT: 'test' }, null)
const container = createContainer({
  settings,
  db: { collection: () => ({}) } as unknown as Db,
  logger: memoryLogger().logger,
  posthog: null,
})
const routes = createRoutes(container)
const document = createOpenApi(routes, 'peerhub') as {
  info: { version: string }
  paths: Record<string, Record<string, unknown>>
  components: { schemas: Record<string, unknown> }
}

test('describes every route of the API', () => {
  const described = Object.entries(document.paths).flatMap(([path, methods]) =>
    Object.keys(methods).map((method) => `${method.toUpperCase()} ${path}`),
  )
  const served = routes
    .filter((route) => route.docs)
    .map((route) => `${route.method} ${route.path.replace(/:(\w+)/g, '{$1}')}`)
  expect(described.sort()).toEqual(served.sort())
  expect(described).toHaveLength(20)
})

test('is stable', () => {
  expect({ ...document, info: { ...document.info, version: '<version>' } }).toMatchSnapshot()
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
