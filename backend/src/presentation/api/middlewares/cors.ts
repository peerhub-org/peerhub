import type { RequestHandler } from 'express'
import { sendText } from '../responses.ts'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
const HEADERS = ['Accept', 'Accept-Language', 'Authorization', 'Content-Language', 'Content-Type']
const MAX_AGE_SECONDS = '600'

/** CORS with the responses of Starlette's CORSMiddleware (the "cors" package differs). */
export function cors(allowedOrigins: readonly string[]): RequestHandler {
  const origins = new Set(allowedOrigins)
  const allowedHeaders = new Set(HEADERS.map((header) => header.toLowerCase()))

  return (req, res, next) => {
    const origin = req.headers.origin
    if (origin === undefined) return next()

    const allowed = origins.has(origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    if (allowed) res.setHeader('Access-Control-Allow-Origin', origin)

    const requestedMethod = req.headers['access-control-request-method']
    if (req.method !== 'OPTIONS' || requestedMethod === undefined) {
      if (allowed) res.setHeader('Vary', 'Origin')
      return next()
    }

    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', METHODS.join(', '))
    res.setHeader('Access-Control-Allow-Headers', HEADERS.join(', '))
    res.setHeader('Access-Control-Max-Age', MAX_AGE_SECONDS)

    const requestedHeaders = req.headers['access-control-request-headers']?.split(',') ?? []
    const failures: string[] = []
    if (!allowed) failures.push('origin')
    if (!METHODS.includes(requestedMethod)) failures.push('method')
    if (requestedHeaders.some((header) => !allowedHeaders.has(header.trim().toLowerCase())))
      failures.push('headers')

    if (failures.length > 0) sendText(res, 400, `Disallowed CORS ${failures.join(', ')}`)
    else sendText(res, 200, 'OK')
  }
}
