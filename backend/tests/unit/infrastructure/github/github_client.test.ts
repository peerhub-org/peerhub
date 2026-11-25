import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import {
  GitHubAPIException,
  UserNotFoundException,
} from '../../../../src/domain/shared/exceptions.ts'
import { GitHubClient } from '../../../../src/infrastructure/github/external/github_client.ts'
import { memoryLogger } from '../../../helpers/logger.ts'

const API = 'https://api.github.com'
const OAUTH = 'https://github.com/login/oauth/access_token'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

let requests: Request[] = []
const reply = (method: 'get' | 'post', url: string, status: number, body: unknown) =>
  server.use(
    http[method](url, ({ request }) => {
      requests.push(request.clone())
      return HttpResponse.json(body as object, { status })
    }),
  )

const { logger, lines } = memoryLogger()
const messages = () => lines.map((line) => line.message)
const client = new GitHubClient(
  {
    GITHUB_CLIENT_ID: 'id',
    GITHUB_CLIENT_SECRET: 'secret',
    SSO_CALLBACK_HOSTNAME: 'http://localhost:5173',
  },
  logger,
)

beforeEach(() => {
  requests = []
  lines.length = 0
})

describe('fetchGitHubUserData', () => {
  const user = { login: 'alice', name: 'Alice', avatar_url: 'https://a.test/a.png', type: 'User' }
  const emails = [
    { email: 'other@example.test', primary: false, verified: true },
    { email: 'alice@example.test', primary: true, verified: true },
  ]

  test('exchanges the code and reads profile and email', async () => {
    reply('post', OAUTH, 200, { access_token: 'gho_1' })
    reply('get', `${API}/user`, 200, user)
    reply('get', `${API}/user/emails`, 200, emails)

    expect(await client.fetchGitHubUserData('the code&x=1')).toEqual({
      profile: {
        username: 'alice',
        name: 'Alice',
        bio: null,
        avatarUrl: 'https://a.test/a.png',
        type: 'User',
      },
      email: 'alice@example.test',
      accessToken: 'gho_1',
    })
    const [oauth, ...api] = requests
    expect(Object.fromEntries(new URLSearchParams(await oauth!.text()))).toEqual({
      client_id: 'id',
      client_secret: 'secret',
      code: 'the code&x=1',
      redirect_uri: 'http://localhost:5173/oauth/callback',
    })
    expect(oauth!.headers.get('accept')).toBe('application/json')
    for (const request of api) {
      expect(request.headers.get('authorization')).toBe('Bearer gho_1')
      expect(request.headers.get('accept')).toBe('application/vnd.github+json')
    }
  })

  test.each([
    ['refused code', 200, { error: 'bad_verification_code' }],
    ['unavailable service', 503, {}],
  ])('fails without token: %s', async (_, status, body) => {
    reply('post', OAUTH, status, body)
    await expect(client.fetchGitHubUserData('code')).rejects.toThrow(
      new GitHubAPIException('Failed to get access token from GitHub.'),
    )
  })

  test('fails without profile', async () => {
    reply('post', OAUTH, 200, { access_token: 'gho_1' })
    reply('get', `${API}/user`, 401, {})
    await expect(client.fetchGitHubUserData('code')).rejects.toThrow(
      new GitHubAPIException('Failed to fetch user data from GitHub.'),
    )
    expect(messages()).toEqual(['Failed to fetch authenticated user: status=401'])
  })

  test.each([
    ['unverified', 200, [{ email: 'a@x', primary: true, verified: false }]],
    ['refused', 403, {}],
  ])('works without email: %s', async (_, status, body) => {
    reply('post', OAUTH, 200, { access_token: 'gho_1' })
    reply('get', `${API}/user`, 200, user)
    reply('get', `${API}/user/emails`, status, body)
    expect(await client.fetchGitHubUserData('code')).toMatchObject({ email: null })
    expect(messages()).toEqual([`Failed to fetch user emails: status=${status}`])
  })
})

describe('fetchUserByUsername', () => {
  test('returns the profile, spelled as on GitHub', async () => {
    reply('get', `${API}/users/carolx`, 200, { login: 'CarolX' })
    expect(await client.fetchUserByUsername('carolx', 'gho')).toEqual({
      username: 'CarolX',
      name: null,
      bio: null,
      avatarUrl: null,
      type: null,
    })
  })

  test.each(['..', '../user', 'a/b', 'a?b', 'a#b', 'a b', 'a%2Fb', '', 'x'.repeat(101)])(
    '%j cannot be a user and is not asked for',
    async (username) => {
      await expect(client.fetchUserByUsername(username, 'gho')).rejects.toThrow(
        new UserNotFoundException(username),
      )
      expect(requests).toEqual([])
    },
  )

  test.each(['octo-cat', 'mona_company', 'Dependabot[bot]'])(
    '%s can be a user',
    async (username) => {
      reply('get', `${API}/users/:username`, 200, { login: username })
      expect(await client.fetchUserByUsername(username, 'gho')).toMatchObject({ username })
      expect(requests[0]!.url).toBe(`${API}/users/${encodeURIComponent(username)}`)
    },
  )

  test('tells unknown users from failures', async () => {
    reply('get', `${API}/users/bob`, 404, {})
    await expect(client.fetchUserByUsername('bob', 'gho')).rejects.toThrow(
      new UserNotFoundException('bob'),
    )
    reply('get', `${API}/users/bob`, 500, {})
    await expect(client.fetchUserByUsername('bob', 'gho')).rejects.toThrow(
      new GitHubAPIException('Failed to fetch GitHub user'),
    )
    expect(messages()).toEqual(['GitHub API error fetching user bob: status=500'])
  })

  test('does not follow redirects with the token', async () => {
    server.use(http.get(`${API}/users/old`, () => HttpResponse.redirect('https://evil.test/', 301)))
    await expect(client.fetchUserByUsername('old', 'gho')).rejects.toThrow(GitHubAPIException)
  })

  test('network failures are not domain errors', async () => {
    server.use(http.get(`${API}/users/bob`, () => HttpResponse.error()))
    const failure = client.fetchUserByUsername('bob', 'gho')
    await expect(failure).rejects.toThrow()
    await expect(failure).rejects.not.toThrow(GitHubAPIException)
  })
})

describe('searchUsers', () => {
  test('restricts the search to users', async () => {
    reply('get', `${API}/search/users`, 200, {
      items: [
        { login: 'alice', avatar_url: 'https://a.test/a.png', type: 'User', id: 1 },
        { login: 'alina', avatar_url: 'https://a.test/b.png' },
      ],
    })
    expect(await client.searchUsers('ali&per_page=1', 'gho')).toEqual([
      { login: 'alice', avatarUrl: 'https://a.test/a.png', type: 'User' },
      { login: 'alina', avatarUrl: 'https://a.test/b.png', type: null },
    ])
    const { searchParams } = new URL(requests[0]!.url)
    expect([...searchParams]).toEqual([['q', 'type:user ali&per_page=1']])
  })

  test('fails', async () => {
    reply('get', `${API}/search/users`, 422, {})
    await expect(client.searchUsers('', 'gho')).rejects.toThrow(
      new GitHubAPIException('Failed to search GitHub users'),
    )
  })
})

describe('fetchFollowingSample', () => {
  test('reads one page', async () => {
    reply('get', `${API}/users/alice/following`, 200, [
      { login: 'bob', avatar_url: null, type: 'User' },
      {},
    ])
    expect(await client.fetchFollowingSample('alice', 'gho')).toEqual([
      { login: 'bob', avatarUrl: null, type: 'User' },
      { login: null, avatarUrl: null, type: null },
    ])
    expect(new URL(requests[0]!.url).search).toBe('?per_page=100')
  })

  test('fails', async () => {
    reply('get', `${API}/users/alice/following`, 500, {})
    await expect(client.fetchFollowingSample('alice', 'gho')).rejects.toThrow(
      new GitHubAPIException('Failed to fetch GitHub following list'),
    )
  })
})

test('tokens and secrets are never logged', async () => {
  reply('post', OAUTH, 503, {})
  reply('get', `${API}/users/bob`, 500, {})
  await client.fetchGitHubUserData('the-code').catch(() => {})
  await client.fetchUserByUsername('bob', 'gho_token').catch(() => {})
  expect(JSON.stringify(lines)).not.toMatch(/the-code|gho_token|secret/)
})
