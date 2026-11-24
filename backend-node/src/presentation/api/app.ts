import express, { type Express } from 'express'
import type { Settings } from '../../infrastructure/shared/config/config.ts'
import { namedLogger, type Logger } from '../../infrastructure/shared/observability/logging.ts'
import { accessLog } from './middlewares/access_log.ts'
import { cors } from './middlewares/cors.ts'
import { errorHandler } from './middlewares/error_handler.ts'
import { routeGuard } from './middlewares/route_guard.ts'
import type { Route } from './routes.ts'

export interface AppOptions {
  settings: Pick<Settings, 'BACKEND_CORS_ORIGINS'>
  logger: Logger
  routes: readonly Route[]
}

export function createApp({ settings, logger, routes }: AppOptions): Express {
  const app = express()
  app.disable('x-powered-by')
  app.set('etag', false)
  app.set('case sensitive routing', true)
  app.set('strict routing', true)

  app.use(accessLog(namedLogger(logger, 'access')))
  if (settings.BACKEND_CORS_ORIGINS.length > 0) app.use(cors(settings.BACKEND_CORS_ORIGINS))
  app.use(routeGuard(routes))
  for (const route of routes) {
    const method = route.method.toLowerCase() as Lowercase<Route['method']>
    app[method](route.path, ...route.handlers)
  }
  app.use(errorHandler(namedLogger(logger, 'api')))
  return app
}
