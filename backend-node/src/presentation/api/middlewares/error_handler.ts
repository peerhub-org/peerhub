import { STATUS_CODES } from 'node:http'
import type { ErrorRequestHandler } from 'express'
import { DomainException } from '../../../domain/shared/exceptions.ts'
import type { Logger } from '../../../infrastructure/shared/observability/logging.ts'
import { HttpError, RequestValidationError } from '../errors.ts'
import { sendJson, sendText } from '../responses.ts'

const CORS_HEADERS = ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials', 'Vary']

/** Called with every error that ends in a 500. */
export type CaptureException = (error: unknown, properties: Record<string, string>) => void

export function errorHandler(logger: Logger, capture?: CaptureException): ErrorRequestHandler {
  return (error: unknown, req, res, next) => {
    if (res.headersSent) return next(error)

    if (error instanceof DomainException)
      return sendJson(res, error.statusCode, { detail: error.message })

    if (error instanceof RequestValidationError) return sendJson(res, 422, { detail: error.issues })

    if (error instanceof HttpError) {
      for (const [name, value] of Object.entries(error.headers)) res.setHeader(name, value)
      return sendJson(res, error.status, { detail: error.message })
    }

    // Raised by Express itself: invalid percent-encoding, body too large...
    const status = clientErrorStatus(error)
    if (status !== null) return sendJson(res, status, { detail: STATUS_CODES[status] })

    logger.error({ error }, `Unhandled exception on ${req.method} ${req.path}`)
    capture?.(error, { path: req.path, method: req.method })
    // Unhandled errors are rendered outside CORS in the Python backend.
    for (const name of CORS_HEADERS) res.removeHeader(name)
    sendText(res, 500, 'Internal Server Error')
  }
}

/** Status of errors raised by Express about the request, or null for any other error. */
function clientErrorStatus(error: unknown): number | null {
  if (error instanceof URIError) return 400
  if (!(error instanceof Error) || !('expose' in error) || !('status' in error)) return null
  return error.expose === true && typeof error.status === 'number' ? error.status : null
}
