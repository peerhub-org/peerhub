import { DomainException } from '../../../../domain/shared/exceptions.ts'
import {
  GITHUB_OAUTH_AUTHORIZE_URL,
  GITHUB_OAUTH_SCOPE,
  RATE_LIMIT_AUTH_EXCHANGE,
  RATE_LIMIT_USER_REFRESH,
  RATE_LIMIT_USER_SEARCH,
} from '../../../../infrastructure/shared/constants.ts'
import { namedLogger } from '../../../../infrastructure/shared/observability/logging.ts'
import type { Container } from '../../container.ts'
import { endpoint, publicEndpoint, type Endpoint } from '../../endpoint.ts'
import { HttpError } from '../../errors.ts'
import {
  exchangeCodeRequest,
  oauthUrlResponse,
  searchUsersQuery,
  tokenResponse,
  toUserResponse,
  toUserSearchResponse,
  userResponse,
  userSearchResponse,
} from './schemas.ts'

export function usersEndpoints(container: Container): Endpoint[] {
  const { settings, logger, tokenService, accountService, useCases } = container
  const log = namedLogger(logger, 'users')

  return [
    publicEndpoint({
      method: 'GET',
      path: '/users/auth',
      tag: 'github',
      summary: 'Get GitHub OAuth login URL.',
      response: oauthUrlResponse,
      async handler() {
        // The frontend adds the "state" parameter, which it checks when the user comes back.
        const url =
          GITHUB_OAUTH_AUTHORIZE_URL +
          `?client_id=${settings.GITHUB_CLIENT_ID}` +
          `&redirect_uri=${settings.SSO_CALLBACK_HOSTNAME}/oauth/callback` +
          `&scope=${GITHUB_OAUTH_SCOPE}`
        return { url }
      },
    }),

    publicEndpoint({
      method: 'POST',
      path: '/users/exchange-token',
      tag: 'github',
      summary: 'Exchange GitHub OAuth code for access token.',
      body: exchangeCodeRequest,
      response: tokenResponse,
      rateLimit: RATE_LIMIT_AUTH_EXCHANGE,
      async handler({ body }) {
        if (!body.code) throw new HttpError(400, 'Authorization code not provided.')
        try {
          const account = await useCases.authenticateWithGitHub.execute(body.code)
          return { token: await tokenService.createAccessToken(account.uuid) }
        } catch (error) {
          if (error instanceof DomainException) throw error
          log.error({ error }, 'Unexpected error during authentication')
          throw new HttpError(400, 'Authentication failed')
        }
      },
    }),

    endpoint({
      method: 'GET',
      path: '/users/search',
      tag: 'github',
      summary: 'Search GitHub users by query.',
      query: searchUsersQuery,
      response: userSearchResponse,
      rateLimit: RATE_LIMIT_USER_SEARCH,
      async handler({ query, accountUuid }) {
        return toUserSearchResponse(await useCases.searchUsers.execute(query.q, accountUuid))
      },
    }),

    endpoint({
      method: 'GET',
      path: '/users/:username',
      tag: 'github',
      summary: 'Get a GitHub user by username.',
      response: userResponse,
      async handler({ params, accountUuid }) {
        return toUserResponse(await useCases.getUser.execute(params.username!, accountUuid))
      },
    }),

    endpoint({
      method: 'POST',
      path: '/users/:username/refresh',
      tag: 'github',
      summary: "Force-refresh a GitHub user's data from GitHub.",
      response: userResponse,
      rateLimit: RATE_LIMIT_USER_REFRESH,
      async handler({ params, accountUuid }) {
        const username = params.username!
        const account = await accountService.getAccountByUuid(accountUuid)
        if (account.username !== username)
          throw new HttpError(403, 'You can only refresh your own profile data.')
        return toUserResponse(await useCases.getUser.execute(username, accountUuid, true))
      },
    }),
  ]
}
