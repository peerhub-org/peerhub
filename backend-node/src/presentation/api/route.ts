import type { RequestHandler } from 'express'
import type { RouteDocs } from './endpoint.ts'

export interface Route {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  /** Full path, Express syntax. Static paths must come before parametrized ones. */
  path: string
  handlers: RequestHandler[]
  /** Absent in routes that are not part of the API. */
  docs?: RouteDocs
}

const toPattern = (path: string): RegExp =>
  new RegExp(
    `^${path
      .split('/')
      .map((part) => (part.startsWith(':') ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      .join('/')}$`,
  )

export type RouteMatch =
  | { kind: 'found' }
  | { kind: 'method-not-allowed'; allow: string }
  | { kind: 'not-found' }

export function createRouteMatcher(
  routes: readonly Route[],
): (method: string, path: string) => RouteMatch {
  const table = routes.map((route) => ({ method: route.method, pattern: toPattern(route.path) }))
  return (method, path) => {
    const candidates = table.filter((route) => route.pattern.test(path))
    if (candidates.some((route) => route.method === method)) return { kind: 'found' }
    // Only the first candidate is reported, as Starlette does.
    const first = candidates[0]
    return first ? { kind: 'method-not-allowed', allow: first.method } : { kind: 'not-found' }
  }
}
