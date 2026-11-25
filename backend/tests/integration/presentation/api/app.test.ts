import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import request from 'supertest'
import { describe, expect, test } from 'vitest'
import { AccountNotFoundException } from '../../../../src/domain/shared/exceptions.ts'
import { createApp } from '../../../../src/presentation/api/app.ts'
import { HttpError } from '../../../../src/presentation/api/errors.ts'
import { sendJson } from '../../../../src/presentation/api/responses.ts'
import type { Route } from '../../../../src/presentation/api/route.ts'
import { startServer, stopServer } from '../../../../src/server.ts'
import { ALLOWED_ORIGIN } from '../../../helpers/requests.ts'
import { memoryLogger } from '../../../helpers/logger.ts'

const { logger, lines } = memoryLogger()
const settings = { BACKEND_CORS_ORIGINS: [ALLOWED_ORIGIN] }

/** Routes with handlers that only echo which one was reached. */
const stubs = [
  'GET /api/v1/health',
  'GET /api/v1/account',
  'DELETE /api/v1/account',
  'GET /api/v1/account/feed',
  'GET /api/v1/users/auth',
  'GET /api/v1/users/search',
  'GET /api/v1/users/:username',
  'POST /api/v1/reviews',
  'GET /api/v1/reviews/suggestions',
  'GET /api/v1/reviews/:username/reviewers',
  'GET /api/v1/reviews/:username',
  'GET /api/v1/watchlist/check/:username',
].map((line): Route => {
  const [method, path] = line.split(' ') as [Route['method'], string]
  return { method, path, handlers: [(_req, res) => sendJson(res, 200, { route: path })] }
})
const app = createApp({ settings, logger, routes: stubs })

const captured: unknown[] = []
const failing = createApp({
  settings,
  logger,
  captureException: (error, properties) => captured.push([error, properties]),
  routes: [
    {
      method: 'GET',
      path: '/async-error',
      handlers: [async () => Promise.reject(new Error('secret detail'))],
    },
    {
      method: 'GET',
      path: '/http-error',
      handlers: [
        () => {
          throw new HttpError(401, 'Not authenticated', { 'WWW-Authenticate': 'Bearer' })
        },
      ],
    },
    {
      method: 'GET',
      path: '/domain-error',
      handlers: [async () => Promise.reject(new AccountNotFoundException('x'))],
    },
    { method: 'GET', path: '/users/:username', handlers: [(_req, res) => sendJson(res, 200, {})] },
  ],
})

describe('routing', () => {
  test.each([
    ['/api/v1/users/auth', '/api/v1/users/auth'],
    ['/api/v1/users/search', '/api/v1/users/search'],
    ['/api/v1/users/bob', '/api/v1/users/:username'],
    ['/api/v1/reviews/suggestions', '/api/v1/reviews/suggestions'],
    ['/api/v1/reviews/bob/reviewers', '/api/v1/reviews/:username/reviewers'],
    ['/api/v1/watchlist/check/bob', '/api/v1/watchlist/check/:username'],
  ])('%s reaches %s', async (path, route) => {
    const response = await request(app).get(path)
    expect(response.body).toEqual({ route })
  })

  test('keeps the query on redirects', async () => {
    const response = await request(app).get('/api/v1/account/feed/?limit=2').redirects(0)
    expect(response.status).toBe(307)
    expect(response.headers.location).toMatch(/\/api\/v1\/account\/feed\?limit=2$/)
  })

  test('drops every trailing slash on redirects', async () => {
    const response = await request(app).get('/api/v1/account///').redirects(0)
    expect(response.status).toBe(307)
    expect(response.headers.location).toMatch(/\/api\/v1\/account$/)
  })

  test('only slashes are not found', async () => {
    expect((await request(app).get('///')).status).toBe(404)
  })

  test('paths full of slashes are answered at once', async () => {
    const start = performance.now()
    const response = await request(app).get(`${'/'.repeat(15_000)}x/`)
    expect(response.status).toBe(404)
    expect(performance.now() - start).toBeLessThan(100)
  })

  test('OPTIONS without preflight headers is not allowed', async () => {
    const response = await request(app).options('/api/v1/reviews')
    expect(response.status).toBe(405)
    expect(response.body).toEqual({ detail: 'Method Not Allowed' })
  })

  test('invalid percent-encoding is a client error', async () => {
    const response = await request(failing).get('/users/%ZZ')
    expect(response.status).toBe(400)
    expect(response.body).toEqual({ detail: 'Bad Request' })
  })

  test('sends no framework headers', async () => {
    const { headers } = await request(app).get('/api/v1/health')
    expect(headers).not.toHaveProperty('x-powered-by')
    expect(headers).not.toHaveProperty('etag')
    expect(headers['content-type']).toBe('application/json')
  })
})

describe('cors', () => {
  test('simple request from an allowed origin', async () => {
    const { headers } = await request(app).get('/api/v1/users/auth').set('Origin', ALLOWED_ORIGIN)
    expect(headers).toMatchObject({
      'access-control-allow-origin': ALLOWED_ORIGIN,
      'access-control-allow-credentials': 'true',
      vary: 'Origin',
    })
  })

  test('simple request from another origin', async () => {
    const { headers } = await request(app)
      .get('/api/v1/users/auth')
      .set('Origin', 'http://evil.test')
    expect(headers).not.toHaveProperty('access-control-allow-origin')
  })

  test.each([
    ['DELETE', 'content-type', 200, 'OK'],
    ['TRACE', 'content-type', 400, 'Disallowed CORS method'],
    ['GET', 'x-other', 400, 'Disallowed CORS headers'],
  ])('preflight for %s with %s', async (method, header, status, text) => {
    const response = await request(app).options('/api/v1/reviews').set({
      Origin: ALLOWED_ORIGIN,
      'Access-Control-Request-Method': method,
      'Access-Control-Request-Headers': header,
    })
    expect(response.status).toBe(status)
    expect(response.text).toBe(text)
  })

  test('is off when no origin is configured', async () => {
    const closed = createApp({ settings: { BACKEND_CORS_ORIGINS: [] }, logger, routes: stubs })
    const { headers } = await request(closed).get('/api/v1/health').set('Origin', ALLOWED_ORIGIN)
    expect(headers).not.toHaveProperty('access-control-allow-credentials')
  })
})

describe('errors', () => {
  test('unhandled errors are opaque, logged and sent without CORS headers', async () => {
    lines.length = 0
    captured.length = 0
    const response = await request(failing)
      .get('/async-error?token=x')
      .set('Origin', ALLOWED_ORIGIN)
    expect(response.status).toBe(500)
    expect(response.text).toBe('Internal Server Error')
    expect(response.headers['content-type']).toBe('text/plain; charset=utf-8')
    expect(response.headers).not.toHaveProperty('access-control-allow-origin')
    expect(response.headers).not.toHaveProperty('vary')
    expect(lines).toContainEqual(
      expect.objectContaining({
        level: 'ERROR',
        message: 'Unhandled exception on GET /async-error',
        error: expect.objectContaining({ message: 'secret detail' }),
      }),
    )
    expect(captured).toEqual([
      [new Error('secret detail'), { path: '/async-error', method: 'GET' }],
    ])
  })

  test('domain errors carry their own status', async () => {
    captured.length = 0
    const response = await request(failing).get('/domain-error').set('Origin', ALLOWED_ORIGIN)
    expect(response.status).toBe(404)
    expect(response.body).toEqual({ detail: 'Account not found: x' })
    expect(captured).toEqual([])
    expect(response.headers).toHaveProperty('access-control-allow-origin')
  })

  test('HTTP errors carry detail, headers and CORS', async () => {
    const response = await request(failing).get('/http-error').set('Origin', ALLOWED_ORIGIN)
    expect(response.status).toBe(401)
    expect(response.body).toEqual({ detail: 'Not authenticated' })
    expect(response.headers).toMatchObject({
      'www-authenticate': 'Bearer',
      'access-control-allow-origin': ALLOWED_ORIGIN,
    })
  })
})

test('requests are logged', async () => {
  lines.length = 0
  await request(app).get('/api/v1/nope?x=1')
  expect(lines).toContainEqual(
    expect.objectContaining({
      logger: 'access',
      message: expect.stringMatching(/ - "GET \/api\/v1\/nope\?x=1 HTTP\/1\.1" 404$/),
    }),
  )
})

describe('shutdown', () => {
  const url = (server: Server) => `http://127.0.0.1:${(server.address() as AddressInfo).port}`

  test('waits for requests in flight', async () => {
    let release = () => {}
    let reached = () => {}
    const inFlight = new Promise<void>((resolve) => (reached = resolve))
    const server = await startServer(
      (_req, res) => {
        release = () => res.end('done')
        reached()
      },
      0,
      '127.0.0.1',
    )
    const address = url(server)
    const pending = fetch(address)
    await inFlight
    const stopped = stopServer(server)
    release()
    expect(await (await pending).text()).toBe('done')
    await stopped
    await expect(fetch(address)).rejects.toThrow()
  })

  test('cuts requests that never end', async () => {
    let reached = () => {}
    const inFlight = new Promise<void>((resolve) => (reached = resolve))
    const server = await startServer(() => reached(), 0, '127.0.0.1')
    const outcome = fetch(url(server)).then(
      () => 'answered',
      () => 'cut',
    )
    await inFlight
    await stopServer(server, 50)
    expect(await outcome).toBe('cut')
  })
})
