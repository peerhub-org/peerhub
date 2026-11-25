import type { Request, RequestHandler, Response } from 'express'
import type { z } from 'zod'
import type { Uuid } from '../../domain/shared/uuid.ts'
import type { RateLimit } from '../../infrastructure/shared/constants.ts'
import type { TokenService } from '../../infrastructure/shared/security/token_service.ts'
import { authenticate } from './middlewares/auth.ts'
import { parseBody, readBody } from './middlewares/body.ts'
import { rateLimit } from './middlewares/rate_limit.ts'
import { sendJson } from './responses.ts'
import type { Route } from './route.ts'
import { validate } from './validation.ts'

/** What the OpenAPI document tells about a route. */
export interface RouteDocs {
  tag: string
  summary: string
  authenticated: boolean
  status: number
  query?: z.ZodObject
  body?: z.ZodObject
  response?: z.ZodType
}

interface Input<Q extends z.ZodObject, B extends z.ZodObject> {
  params: Record<string, string>
  query: z.output<Q>
  body: z.output<B>
}

interface Spec<Q extends z.ZodObject, B extends z.ZodObject, R extends z.ZodType, I> {
  method: Route['method']
  path: string
  tag: string
  summary: string
  query?: Q
  body?: B
  /** Response schema. Without one, the response has no content. */
  response?: R
  status?: number
  rateLimit?: RateLimit
  handler: (input: Input<Q, B> & I) => Promise<z.output<R>>
}

export interface EndpointContext {
  tokenService: TokenService
  clientIpHeader: string | null
}

export type Endpoint = (context: EndpointContext) => Route

/** Declare an endpoint for signed in users. */
export function endpoint<
  Q extends z.ZodObject,
  B extends z.ZodObject,
  R extends z.ZodType = z.ZodVoid,
>(spec: Spec<Q, B, R, { accountUuid: Uuid }>): Endpoint {
  return (context) =>
    toRoute(spec, context, async (req) => ({
      accountUuid: await authenticate(req, context.tokenService),
    }))
}

/** Declare an endpoint for everybody. */
export function publicEndpoint<
  Q extends z.ZodObject,
  B extends z.ZodObject,
  R extends z.ZodType = z.ZodVoid,
>(spec: Spec<Q, B, R, unknown>): Endpoint {
  return (context) => toRoute(spec, context, null)
}

/**
 * Steps in the order of the Python backend: malformed bodies are refused first, then
 * requests without credentials, then invalid ones. Only the others count as hits.
 */
function toRoute<Q extends z.ZodObject, B extends z.ZodObject, R extends z.ZodType, I>(
  spec: Spec<Q, B, R, I>,
  { clientIpHeader }: EndpointContext,
  identify: ((req: Request) => Promise<I>) | null,
): Route {
  const { query, body, response, status = response ? 200 : 204 } = spec

  const check: RequestHandler = async (req, res, next) => {
    const rawBody = body && parseBody(req)
    const identity = identify && (await identify(req))
    res.locals.input = {
      ...identity,
      params: req.params,
      query: query && validate(query, queryValues(req, query), 'query'),
      body: body && validate(body, rawBody, 'body'),
    }
    next()
  }
  const run: RequestHandler = async (_req, res: Response) => {
    const result = await spec.handler(res.locals.input as Input<Q, B> & I)
    if (response) return sendJson(res, status, result)
    res.statusCode = status
    // Sent by the Python backend even without content
    res.setHeader('Content-Type', 'application/json')
    res.end()
  }

  return {
    method: spec.method,
    path: spec.path,
    handlers: [
      ...(body ? [readBody] : []),
      check,
      ...(spec.rateLimit ? [rateLimit(spec.rateLimit, clientIpHeader)] : []),
      run,
    ],
    docs: {
      tag: spec.tag,
      summary: spec.summary,
      authenticated: identify !== null,
      status,
      query,
      body,
      response,
    },
  }
}

/** Declared query parameters. As in FastAPI, the last value of a repeated one counts. */
function queryValues(req: Request, schema: z.ZodObject): Record<string, string> {
  const start = req.url.indexOf('?')
  const params = new URLSearchParams(start === -1 ? '' : req.url.slice(start))
  return Object.fromEntries(
    Object.keys(schema.shape).flatMap((name) => {
      const value = params.getAll(name).at(-1)
      return value === undefined ? [] : [[name, value]]
    }),
  )
}
