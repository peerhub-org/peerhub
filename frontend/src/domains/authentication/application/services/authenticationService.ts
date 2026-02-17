import axios from 'axios'
import { API_BASE_URL } from '@shared/application/config/env'
import { z } from 'zod'

const oauthUrlSchema = z.object({ url: z.string() })
const tokenSchema = z.object({ token: z.string() })

class AuthService {
  async getGithubOAuthUrl(): Promise<string> {
    const response = await axios.get(API_BASE_URL + 'users/auth')
    return oauthUrlSchema.parse(response.data).url
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
