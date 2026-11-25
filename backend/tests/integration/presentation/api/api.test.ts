import request from 'supertest'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createTestApp, type TestApp } from '../../../helpers/app.ts'
import { contractTokens } from '../../../helpers/contract.ts'
import { useDatabase } from '../../../helpers/database.ts'

const db = useDatabase({ withFixtures: true })
let context: TestApp
beforeEach(() => void (context = createTestApp(db())))
afterEach(() => void vi.useRealTimers())

const as = (name: string) => ({ Authorization: `Bearer ${contractTokens.tokens[name]}` })
const exchange = () => request(context.app).post('/api/v1/users/exchange-token').send({ code: '' })

describe('authorization header', () => {
  const account = (authorization: string) =>
    request(context.app).get('/api/v1/account').set('Authorization', authorization)
  const token = as('alice').Authorization.replace('Bearer ', '')

  test.each([`Bearer ${token}`, `bearer ${token}`, `BEARER   ${token}`])(
    'is accepted: %#',
    async (header) => {
      expect((await account(header)).status).toBe(200)
    },
  )

  test.each(['Bearer', 'Bearer ', `Bearer ${token} x`, `Bearer${' '.repeat(12_000)}x`])(
    'has no valid token: %#',
    async (header) => {
      const response = await account(header)
      expect(response.status).toBe(401)
      expect(response.body).toEqual({ detail: 'Could not validate credentials' })
    },
  )

  test.each([`Basic ${token}`, token, `Bearer${token}`, `x Bearer ${token}`])(
    'is not a bearer token: %#',
    async (header) => {
      const response = await account(header)
      expect(response.status).toBe(401)
      expect(response.body).toEqual({ detail: 'Not authenticated' })
    },
  )
})

describe('rate limits', () => {
  test('start again after the window', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    for (let i = 0; i < 5; i++) expect((await exchange()).status).toBe(400)
    expect((await exchange()).status).toBe(429)
    vi.setSystemTime(Date.now() + 61_000)
    expect((await exchange()).status).toBe(400)
  })

  test('are separate for each path', async () => {
    const refresh = (username: string) =>
      request(context.app).post(`/api/v1/users/${username}/refresh`).set(as('alice'))
    expect((await refresh('bob')).status).toBe(403)
    expect((await refresh('bob')).status).toBe(429)
    expect((await refresh('carol')).status).toBe(403)
  })

  test('cannot be avoided with X-Forwarded-For', async () => {
    const silent = vi.spyOn(console, 'error').mockImplementation(() => {})
    for (let i = 0; i < 5; i++) await exchange().set('X-Forwarded-For', `10.0.0.${i}`)
    expect((await exchange().set('X-Forwarded-For', '10.0.0.9')).status).toBe(429)
    expect(silent).not.toHaveBeenCalled()
    silent.mockRestore()
  })

  describe('with a configured client address header', () => {
    const from = (address: string) =>
      request(context.app)
        .post('/api/v1/users/exchange-token')
        .set('CF-Connecting-IP', address)
        .send({ code: '' })

    beforeEach(() => {
      context = createTestApp(db(), {}, { CLIENT_IP_HEADER: 'cf-connecting-ip' })
    })

    test('count each client apart', async () => {
      for (let i = 0; i < 5; i++) await from('203.0.113.1')
      expect((await from('203.0.113.1')).status).toBe(429)
      expect((await from(' 203.0.113.1 ')).status).toBe(429)
      expect((await from('203.0.113.2')).status).toBe(400)
    })

    test('count together what is not an address', async () => {
      for (let i = 0; i < 5; i++) await from(`made-up-${i}`)
      expect((await from('made-up-9')).status).toBe(429)
      expect((await exchange()).status).toBe(429)
    })
  })

  test('ignore client address headers that are not configured', async () => {
    for (let i = 0; i < 5; i++) await exchange().set('CF-Connecting-IP', `203.0.113.${i}`)
    expect((await exchange().set('CF-Connecting-IP', '203.0.113.9')).status).toBe(429)
  })

  test('send no extra headers', async () => {
    const { headers } = await exchange()
    expect(Object.keys(headers).filter((name) => name.includes('ratelimit'))).toEqual([])
  })
})

describe('bodies', () => {
  const post = () =>
    request(context.app)
      .post('/api/v1/watchlist')
      .set(as('alice'))
      .set('Content-Type', 'application/json')

  test('of 1 MB or more are refused', async () => {
    const response = await post().send(JSON.stringify({ username: 'x'.repeat(1024 * 1024) }))
    expect(response.status).toBe(413)
    expect(response.body).toEqual({ detail: 'Payload Too Large' })
  })

  test('that are not UTF-8 are refused', async () => {
    const response = await post()
      .serialize((value) => value as string)
      .send(Buffer.from([0x22, 0xff, 0x22]))
    expect(response.status).toBe(400)
    expect(response.body).toEqual({ detail: 'There was an error parsing the body' })
  })

  test('malformed are refused before authentication', async () => {
    const response = await request(context.app)
      .post('/api/v1/watchlist')
      .set('Content-Type', 'application/json')
      .send('{"username": ')
    expect(response.status).toBe(422)
    expect(response.body).toMatchObject({ detail: [{ type: 'json_invalid' }] })
  })

  test('absent are refused after authentication', async () => {
    expect((await request(context.app).post('/api/v1/watchlist')).status).toBe(401)
    const response = await request(context.app).post('/api/v1/watchlist').set(as('alice'))
    expect(response.status).toBe(422)
    expect(response.body).toMatchObject({ detail: [{ type: 'missing', loc: ['body'] }] })
  })

  test('may have a JSON type with parameters or suffix', async () => {
    for (const type of ['application/json; charset=utf-8', 'application/vnd.api+json'])
      expect(
        (
          await post()
            .set('Content-Type', type)
            .send(JSON.stringify({ username: 'bob' }))
        ).status,
      ).toBe(201)
  })
})

test('usernames in the path are decoded', async () => {
  const response = await request(context.app).get('/api/v1/watchlist/check/%62ob').set(as('alice'))
  expect(response.body).toEqual({ is_watching: true })
})

describe('documentation', () => {
  test('the OpenAPI document is served', async () => {
    const response = await request(context.app).get('/api/v1/openapi.json')
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ openapi: '3.1.0', info: { title: 'peerhub' } })
  })

  test('/docs shows it', async () => {
    const response = await request(context.app).get('/docs')
    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toMatch(/^text\/html/)
    expect(response.text).toContain('"url":"/api/v1/openapi.json"')
  })
})

test('health tells the state of the database', async () => {
  expect((await request(context.app).get('/api/v1/health')).body).toEqual({
    status: 'healthy',
    database: 'healthy',
    version: 'peerhub',
  })
})

test('unexpected failures to sign in are logged, not shown', async () => {
  const { app, lines } = createTestApp(db(), {
    githubUrls: { api: 'http://127.0.0.1:1', oauth: 'http://127.0.0.1:1' },
  })
  const response = await request(app)
    .post('/api/v1/users/exchange-token')
    .send({ code: 'secret-code' })
  expect(response.status).toBe(400)
  expect(response.body).toEqual({ detail: 'Authentication failed' })
  expect(lines).toContainEqual(
    expect.objectContaining({ message: 'Unexpected error during authentication' }),
  )
  expect(JSON.stringify(lines)).not.toContain('secret-code')
})
