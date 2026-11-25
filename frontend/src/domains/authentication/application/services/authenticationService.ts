import axios from 'axios'
import { API_BASE_URL } from '@shared/application/config/env'
import { z } from 'zod'

const OAUTH_STATE_KEY = 'oauth_state'

const oauthUrlSchema = z.object({ url: z.string() })
const tokenSchema = z.object({ token: z.string() })

function randomState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

class AuthService {
  /**
   * Get the GitHub page to sign in. It carries a random state, kept in this tab: only who
   * started signing in here can finish, so nobody is signed in to the account of another.
   */
  async getGithubOAuthUrl(): Promise<string> {
    const response = await axios.get(API_BASE_URL + 'users/auth')
    const url = new URL(oauthUrlSchema.parse(response.data).url)
    const state = randomState()
    sessionStorage.setItem(OAUTH_STATE_KEY, state)
    url.searchParams.set('state', state)
    return url.toString()
  }

  /** Check the state GitHub sent back. Each state works only once. */
  consumeOAuthState(state: string | null): boolean {
    const expected = sessionStorage.getItem(OAUTH_STATE_KEY)
    sessionStorage.removeItem(OAUTH_STATE_KEY)
    return expected !== null && state === expected
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    const response = await axios.post(API_BASE_URL + 'users/exchange-token', {
      code,
    })
    return tokenSchema.parse(response.data).token
  }

  storeToken(token: string): void {
    localStorage.setItem('token', token)
  }

  getToken(): string | null {
    return localStorage.getItem('token')
  }

  removeToken(): void {
    localStorage.removeItem('token')
  }
}

export default new AuthService()
