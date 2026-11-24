import type { ErrorRequestHandler } from 'express'
import type { Logger } from '../../../infrastructure/shared/observability/logging.ts'
import { HttpError } from '../errors.ts'
import { sendJson, sendText } from '../responses.ts'

const CORS_HEADERS = ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials', 'Vary']

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, req, res, next) => {
    if (res.headersSent) return next(error)

    if (error instanceof HttpError) {
      for (const [name, value] of Object.entries(error.headers)) res.setHeader(name, value)
      return sendJson(res, error.status, { detail: error.message })
    }

    // Raised by Express itself when a path parameter is not valid percent-encoding
    if (error instanceof URIError) return sendJson(res, 400, { detail: 'Bad Request' })

    logger.error({ error }, `Unhandled exception on ${req.method} ${req.path}`)
    // Unhandled errors are rendered outside CORS in the Python backend.
    for (const name of CORS_HEADERS) res.removeHeader(name)
    sendText(res, 500, 'Internal Server Error')
  }
}
