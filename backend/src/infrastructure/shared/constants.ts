export const GITHUB_OAUTH_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
export const GITHUB_OAUTH_SCOPE = 'read:user user:email'
export const GITHUB_API_TIMEOUT_MS = 10_000

export interface RateLimit {
  limit: number
  per: 'minute' | 'hour'
}

export const RATE_LIMIT_AUTH_EXCHANGE: RateLimit = { limit: 5, per: 'minute' }
export const RATE_LIMIT_REVIEW_WRITE: RateLimit = { limit: 5, per: 'minute' }
export const RATE_LIMIT_USER_SEARCH: RateLimit = { limit: 30, per: 'minute' }
export const RATE_LIMIT_USER_REFRESH: RateLimit = { limit: 1, per: 'hour' }
