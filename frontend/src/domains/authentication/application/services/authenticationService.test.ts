import { describe, it, expect, beforeEach } from 'vitest'
import authService from './authenticationService'

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear()
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
    it('returns the OAuth URL from the API', async () => {
      const url = await authService.getGithubOAuthUrl()
      expect(url).toBe('https://github.com/login/oauth/authorize?client_id=test')
    })
  })

  describe('exchangeCodeForToken', () => {
    it('exchanges code for a JWT token', async () => {
      const token = await authService.exchangeCodeForToken('test-code')
      expect(token).toBe('test-jwt-token')
    })
  })
})
