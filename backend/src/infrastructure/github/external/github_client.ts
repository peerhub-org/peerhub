import { GitHubAPIException, UserNotFoundException } from '../../../domain/shared/exceptions.ts'
import type { Settings } from '../../shared/config/config.ts'
import { GITHUB_API_TIMEOUT_MS } from '../../shared/constants.ts'
import type { Logger } from '../../shared/observability/logging.ts'

export interface GitHubProfile {
  username: string
  name: string | null
  bio: string | null
  avatarUrl: string | null
  type: string | null
}

export interface GitHubListedUser {
  login: string | null
  avatarUrl: string | null
  type: string | null
}

export interface GitHubSearchedUser {
  login: string
  avatarUrl: string
  type: string | null
}

interface UserPayload {
  login?: string | null
  name?: string | null
  bio?: string | null
  avatar_url?: string | null
  type?: string | null
}

interface EmailPayload {
  email?: string | null
  primary?: boolean
  verified?: boolean
}

type GitHubSettings = Pick<
  Settings,
  'GITHUB_CLIENT_ID' | 'GITHUB_CLIENT_SECRET' | 'SSO_CALLBACK_HOSTNAME'
>

export interface GitHubUrls {
  api: string
  oauth: string
}

const URLS: GitHubUrls = {
  api: 'https://api.github.com',
  oauth: 'https://github.com/login/oauth/access_token',
}

/** Letters, digits, hyphens, "_" in managed accounts and "[bot]" in bots. */
const USERNAME = /^[a-z\d_-]{1,100}(\[bot\])?$/i

/** Client for the GitHub API and OAuth. */
export class GitHubClient {
  readonly #settings: GitHubSettings
  readonly #logger: Logger
  readonly #urls: GitHubUrls

  constructor(settings: GitHubSettings, logger: Logger, urls: GitHubUrls = URLS) {
    this.#settings = settings
    this.#logger = logger
    this.#urls = urls
  }

  /** Complete the OAuth flow: exchange the code for a token and fetch who signed in. */
  async fetchGitHubUserData(
    code: string,
  ): Promise<{ profile: GitHubProfile; email: string | null; accessToken: string }> {
    const accessToken = await this.#exchangeCodeForToken(code)
    if (!accessToken) throw new GitHubAPIException('Failed to get access token from GitHub.')

    const user = await this.#fetchAuthenticatedUser(accessToken)
    if (user === null) throw new GitHubAPIException('Failed to fetch user data from GitHub.')

    const email = await this.#fetchPrimaryEmail(accessToken)
    return { profile: toProfile(user), email, accessToken }
  }

  async fetchUserByUsername(username: string, accessToken: string): Promise<GitHubProfile> {
    // Anything else cannot exist, and must not reach the URL.
    if (!USERNAME.test(username)) throw new UserNotFoundException(username)
    const response = await this.#get(`/users/${encodeURIComponent(username)}`, accessToken)
    if (response.status === 404) throw new UserNotFoundException(username)
    if (response.status !== 200) {
      this.#logger.error(`GitHub API error fetching user ${username}: status=${response.status}`)
      throw new GitHubAPIException('Failed to fetch GitHub user')
    }
    return toProfile((await response.json()) as UserPayload)
  }

  async searchUsers(query: string, accessToken: string): Promise<GitHubSearchedUser[]> {
    const params = new URLSearchParams({ q: `type:user ${query}` })
    const response = await this.#get(`/search/users?${params}`, accessToken)
    if (response.status !== 200) {
      this.#logger.error(`GitHub API error searching users: status=${response.status}`)
      throw new GitHubAPIException('Failed to search GitHub users')
    }
    const { items = [] } = (await response.json()) as {
      items?: { login: string; avatar_url: string; type?: string | null }[]
    }
    return items.map((item) => ({
      login: item.login,
      avatarUrl: item.avatar_url,
      type: item.type ?? null,
    }))
  }

  /** Fetch a single page of the users the given username follows. */
  async fetchFollowingSample(username: string, accessToken: string): Promise<GitHubListedUser[]> {
    const response = await this.#get(
      `/users/${encodeURIComponent(username)}/following?per_page=100`,
      accessToken,
    )
    if (response.status !== 200) {
      this.#logger.error(
        `GitHub API error fetching following for ${username}: status=${response.status}`,
      )
      throw new GitHubAPIException('Failed to fetch GitHub following list')
    }
    const items = (await response.json()) as UserPayload[]
    return items.map((item) => ({
      login: item.login ?? null,
      avatarUrl: item.avatar_url ?? null,
      type: item.type ?? null,
    }))
  }

  async #exchangeCodeForToken(code: string): Promise<string | null> {
    const response = await this.#request(this.#urls.oauth, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: this.#settings.GITHUB_CLIENT_ID ?? '',
        client_secret: this.#settings.GITHUB_CLIENT_SECRET ?? '',
        code,
        redirect_uri: `${this.#settings.SSO_CALLBACK_HOSTNAME}/oauth/callback`,
      }),
    })
    if (response.status === 200)
      return ((await response.json()) as { access_token?: string }).access_token ?? null

    this.#logger.warn(`Failed to exchange code for token: status=${response.status}`)
    return null
  }

  async #fetchAuthenticatedUser(accessToken: string): Promise<UserPayload | null> {
    const response = await this.#get('/user', accessToken)
    if (response.status === 200) return (await response.json()) as UserPayload

    this.#logger.warn(`Failed to fetch authenticated user: status=${response.status}`)
    return null
  }

  /** The primary email, if it is verified. Signing in works without it. */
  async #fetchPrimaryEmail(accessToken: string): Promise<string | null> {
    const response = await this.#get('/user/emails', accessToken)
    if (response.status === 200) {
      const emails = (await response.json()) as EmailPayload[]
      const primary = emails.find((entry) => entry.primary && entry.verified)
      if (primary) return primary.email ?? null
    }
    this.#logger.warn(`Failed to fetch user emails: status=${response.status}`)
    return null
  }

  #get(path: string, accessToken: string): Promise<Response> {
    return this.#request(`${this.#urls.api}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
      },
    })
  }

  #request(url: string, init: RequestInit): Promise<Response> {
    return fetch(url, {
      ...init,
      // Redirects count as failures, so the token never follows one.
      redirect: 'manual',
      signal: AbortSignal.timeout(GITHUB_API_TIMEOUT_MS),
    })
  }
}

function toProfile(user: UserPayload): GitHubProfile {
  if (!user.login) throw new Error('GitHub user without login')
  return {
    username: user.login,
    name: user.name ?? null,
    bio: user.bio ?? null,
    avatarUrl: user.avatar_url ?? null,
    type: user.type ?? null,
  }
}
