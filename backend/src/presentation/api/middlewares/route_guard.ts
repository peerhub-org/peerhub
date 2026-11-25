import type { RequestHandler } from 'express'
import { HttpError } from '../errors.ts'
import { createRouteMatcher, type Route } from '../route.ts'

/**
 * Reject requests that match no route before Express sees them. Express would otherwise
 * answer HEAD and OPTIONS on its own, return 404 for wrong methods and render HTML.
 */
export function routeGuard(routes: readonly Route[]): RequestHandler {
  const match = createRouteMatcher(routes)

  return (req, res, next) => {
    const { method, path } = req
    const result = match(method, path)
    if (result.kind === 'found') return next()
    if (result.kind === 'method-not-allowed')
      throw new HttpError(405, 'Method Not Allowed', { Allow: result.allow })

    if (path !== '/') {
      const toggled = path.endsWith('/') ? withoutTrailingSlashes(path) : `${path}/`
      if (toggled !== '' && match(method, toggled).kind !== 'not-found') {
        const query = req.url.slice(path.length)
        // Not res.redirect(): it adds a body and re-encodes the location.
        res.statusCode = 307
        res.setHeader('Location', `${req.protocol}://${req.host}${toggled}${query}`)
        res.setHeader('Content-Length', 0)
        res.end()
        return
      }
    }
    throw new HttpError(404, 'Not Found')
  }
}

/** Not a regular expression: those take long on paths with many slashes. */
function withoutTrailingSlashes(path: string): string {
  let end = path.length
  while (path[end - 1] === '/') end--
  return path.slice(0, end)
}
