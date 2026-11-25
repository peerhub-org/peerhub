import { describe, it, expect, beforeEach } from 'vitest'
import authService from './authenticationService'

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('token CRUD', () => {
    it('stores and retrieves token', () => {
      authService.storeToken('my-token')
      expect(authService.getToken()).toBe('my-token')
    })

    it('returns null when no token stored', () => {
      expect(authService.getToken()).toBeNull()
    })

    it('removes token', () => {
      authService.storeToken('my-token')
      authService.removeToken()
      expect(authService.getToken()).toBeNull()
    })
  })

  describe('getGithubOAuthUrl', () => {
    it('returns the OAuth URL from the API with a random state', async () => {
      const url = new URL(await authService.getGithubOAuthUrl())
      expect(url.origin + url.pathname).toBe('https://github.com/login/oauth/authorize')
      expect(url.searchParams.get('client_id')).toBe('test')
      expect(url.searchParams.get('state')).toMatch(/^[0-9a-f]{64}$/)
    })

    it('uses another state each time', async () => {
      expect(await authService.getGithubOAuthUrl()).not.toBe(await authService.getGithubOAuthUrl())
    })
  })

  describe('consumeOAuthState', () => {
    const start = async () =>
      new URL(await authService.getGithubOAuthUrl()).searchParams.get('state')

    it('accepts the state of the sign in, once', async () => {
      const state = await start()
      expect(authService.consumeOAuthState(state)).toBe(true)
      expect(authService.consumeOAuthState(state)).toBe(false)
    })

    it('refuses another state, which also ends the sign in', async () => {
      const state = await start()
      expect(authService.consumeOAuthState('other')).toBe(false)
      expect(authService.consumeOAuthState(state)).toBe(false)
    })

    it('refuses a missing state', async () => {
      expect(authService.consumeOAuthState(null)).toBe(false)
      await start()
      expect(authService.consumeOAuthState(null)).toBe(false)
    })

    it('refuses any state when no sign in was started', () => {
      expect(authService.consumeOAuthState('')).toBe(false)
      expect(authService.consumeOAuthState('x')).toBe(false)
    })
  })

  describe('exchangeCodeForToken', () => {
    it('exchanges code for a JWT token', async () => {
      const token = await authService.exchangeCodeForToken('test-code')
      expect(token).toBe('test-jwt-token')
    })
  })
})
