import type { Container } from './container.ts'
import { docsRoutes } from './openapi.ts'
import type { Route } from './route.ts'
import { accountEndpoints } from './v1/account/account.ts'
import { healthEndpoints } from './v1/health/health.ts'
import { reviewEndpoints } from './v1/review/review.ts'
import { usersEndpoints } from './v1/users/users.ts'
import { watchlistEndpoints } from './v1/watchlist/watchlist.ts'

/** Every route of the application. Rate limits are counted per call to this function. */
export function createRoutes(container: Container): Route[] {
  const { settings, tokenService, accountService } = container
  const routes = [
    ...healthEndpoints(container),
    ...accountEndpoints(container),
    ...usersEndpoints(container),
    ...reviewEndpoints(container),
    ...watchlistEndpoints(container),
  ]
    .map((endpoint) =>
      endpoint({ tokenService, accountService, clientIpHeader: settings.CLIENT_IP_HEADER }),
    )
    .map((route) => ({ ...route, path: `${settings.API_V1_STR}${route.path}` }))
  return [...routes, ...docsRoutes(routes, settings)]
}
