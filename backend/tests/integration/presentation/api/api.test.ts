import { readFileSync } from 'node:fs'
import { ObjectId } from 'mongodb'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createTestApp, type TestApp } from '../../../helpers/app.ts'
import { useDatabase } from '../../../helpers/database.ts'
import { tokens } from '../../../helpers/tokens.ts'

const db = useDatabase({ withFixtures: true })
let context: TestApp
beforeEach(() => void (context = createTestApp(db())))
afterEach(() => void vi.useRealTimers())

const as = (name: string) => ({ Authorization: `Bearer ${tokens[name]}` })
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
    version: readFileSync(new URL('../../../../../VERSION', import.meta.url), 'utf8').trim(),
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

describe('tokens', () => {
  const account = () => request(context.app).get('/api/v1/account').set(as('alice'))

  test('stop working when the account is deleted, and work again when it comes back', async () => {
    const accounts = db().collection('accounts')
    expect((await account()).status).toBe(200)
    await accounts.updateOne({ username: 'alice' }, { $set: { deleted_at: new Date() } })
    const refused = await account()
    expect(refused.status).toBe(401)
    expect(refused.headers['www-authenticate']).toBe('Bearer')
    await accounts.updateOne({ username: 'alice' }, { $set: { deleted_at: null } })
    expect((await account()).status).toBe(200)
  })

  test('are not refused because the database fails', async () => {
    vi.spyOn(
      db().collection('accounts').constructor.prototype as { findOne(): unknown },
      'findOne',
    ).mockRejectedValueOnce(new Error('db down'))
    expect((await account()).status).toBe(500)
  })
})

describe('requests at the same time', () => {
  test('create one review and one watch', async () => {
    const submit = (comment: string) =>
      request(context.app)
        .post('/api/v1/reviews')
        .set(as('bob'))
        .send({ reviewed_username: 'neverseen', status: 'approve', comment })
    const responses = await Promise.all(['a', 'b', 'c', 'd'].map(submit))
    expect(responses.map((response) => response.status)).toEqual([200, 200, 200, 200])
    const filter = { reviewed_username: 'neverseen' }
    expect(await db().collection('reviews').countDocuments(filter)).toBe(1)
    expect(
      await db().collection('watchlist').countDocuments({ watched_username: 'neverseen' }),
    ).toBe(1)
    expect(context.emails).toHaveLength(1)
  })
})

describe('feed', () => {
  test('goes beyond 100 watched users and 100 reviews, without repeating or missing any', async () => {
    const [review] = await db()
      .collection('reviews')
      .find({ reviewed_username: 'popular' })
      .toArray()
    const [watch] = await db().collection('watchlist').find({ watched_username: 'bob' }).toArray()
    const names = Array.from({ length: 130 }, (_, i) => `many${i}`)
    await db()
      .collection('watchlist')
      .insertMany(
        names.map((name) => ({
          ...watch,
          _id: new ObjectId(),
          watched_username: name,
        })),
      )
    const fans = await db().collection('accounts').find({ username: /^fan/ }).toArray()
    await db()
      .collection('reviews')
      .insertMany(
        names.flatMap((name) =>
          fans.slice(0, 2).map((fan) => ({
            ...review,
            _id: new ObjectId(),
            reviewer_uuid: fan.uuid as unknown,
            reviewed_username: name,
          })),
        ),
      )
    const seen: string[] = []
    for (let offset = 0, more = true; more; offset += 50) {
      const response = await request(context.app)
        .get(`/api/v1/account/feed?filter=watching&limit=50&offset=${offset}`)
        .set(as('alice'))
      const body = response.body as { items: { review_id: string }[]; has_more: boolean }
      seen.push(...body.items.map((item) => item.review_id))
      more = body.has_more
    }
    // 130 users with 2 reviews each, and the 2 about dave in the fixtures
    expect(seen).toHaveLength(262)
    expect(new Set(seen).size).toBe(262)
  })
})
