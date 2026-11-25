import { z } from 'zod'
import type { Settings } from '../../infrastructure/shared/config/config.ts'
import { readVersion } from '../../infrastructure/shared/config/version.ts'
import type { RouteDocs } from './endpoint.ts'
import { sendJson } from './responses.ts'
import type { Route } from './route.ts'

const SWAGGER_UI = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.29.0'
const SECURITY_SCHEME = 'BearerAuth'

type DocumentedRoute = Route & { docs: RouteDocs }
type Json = Record<string, unknown>

/** Build the OpenAPI document of the routes. */
export function createOpenApi(routes: readonly Route[], title: string): Json {
  const documented = routes.filter((route): route is DocumentedRoute => route.docs !== undefined)
  const schemas: Json = {}
  const paths: Record<string, Json> = {}
  for (const route of documented) {
    const path = route.path.replace(/:(\w+)/g, '{$1}')
    paths[path] = { ...paths[path], [route.method.toLowerCase()]: operation(route, schemas) }
  }
  return {
    openapi: '3.1.0',
    info: { title, version: readVersion() },
    paths,
    components: {
      schemas,
      securitySchemes: {
        [SECURITY_SCHEME]: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  }
}

function operation({ path, docs }: DocumentedRoute, schemas: Json): Json {
  const content = (schema: z.ZodType, io: 'input' | 'output') => ({
    'application/json': { schema: toSchema(schema, io, schemas) },
  })
  const parameters = [...pathParameters(path), ...queryParameters(docs.query, schemas)]
  const ok: Json = { description: 'Successful Response' }
  if (docs.response) ok.content = content(docs.response, 'output')

  return {
    tags: [docs.tag],
    summary: docs.summary,
    ...(parameters.length > 0 && { parameters }),
    ...(docs.body && { requestBody: { required: true, content: content(docs.body, 'input') } }),
    responses: {
      [docs.status]: ok,
      ...((parameters.length > 0 || docs.body) && { 422: { description: 'Validation Error' } }),
    },
    ...(docs.authenticated && { security: [{ [SECURITY_SCHEME]: [] }] }),
  }
}

function pathParameters(path: string): Json[] {
  return [...path.matchAll(/:(\w+)/g)].map(([, name]) => ({
    name,
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }))
}

function queryParameters(query: z.ZodObject | undefined, schemas: Json): Json[] {
  if (!query) return []
  const { properties = {}, required = [] } = toSchema(query, 'input', schemas) as {
    properties?: Json
    required?: string[]
  }
  return Object.entries(properties).map(([name, schema]) => ({
    name,
    in: 'query',
    required: required.includes(name),
    schema,
  }))
}

/** Convert a schema, moving the named ones into the shared components. */
function toSchema(schema: z.ZodType, io: 'input' | 'output', schemas: Json): Json {
  const { $defs, ...json } = z.toJSONSchema(schema, {
    io,
    // Zod leaves out the defaults of schemas that transform their input.
    override({ zodSchema, jsonSchema }) {
      const { def } = zodSchema._zod
      if (def.type === 'default') jsonSchema.default = def.defaultValue as typeof jsonSchema.default
    },
  }) as Json & { $defs?: Json }
  delete json.$schema
  Object.assign(schemas, toComponentRefs($defs ?? {}))
  return toComponentRefs(json)
}

function toComponentRefs<T>(value: T): T {
  return JSON.parse(JSON.stringify(value).replaceAll('"#/$defs/', '"#/components/schemas/')) as T
}

/** The OpenAPI document and the page to browse it. */
export function docsRoutes(
  routes: readonly Route[],
  settings: Pick<Settings, 'API_V1_STR' | 'PROJECT_NAME'>,
): Route[] {
  const openApiPath = `${settings.API_V1_STR}/openapi.json`
  const document = createOpenApi(routes, settings.PROJECT_NAME)
  const page = docsPage(settings.PROJECT_NAME, openApiPath)
  return [
    {
      method: 'GET',
      path: openApiPath,
      handlers: [(_req, res) => sendJson(res, 200, document)],
    },
    {
      method: 'GET',
      path: '/docs',
      handlers: [(_req, res) => void res.type('html').send(page)],
    },
  ]
}

/** Values go through JSON and have "<" escaped, so they cannot end the script or the title. */
function docsPage(title: string, openApiPath: string): string {
  const text = title.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const config = JSON.stringify({ url: openApiPath, dom_id: '#swagger-ui' }).replace(
    /</g,
    '\\u003c',
  )
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${text} - Swagger UI</title>
<link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css">
</head>
<body>
<div id="swagger-ui"></div>
<script src="${SWAGGER_UI}/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle(${config})</script>
</body>
</html>
`
}
