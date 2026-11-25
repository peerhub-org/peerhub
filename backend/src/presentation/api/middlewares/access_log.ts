import type { RequestHandler } from 'express'
import type { Logger } from '../../../infrastructure/shared/observability/logging.ts'

export function accessLog(logger: Logger): RequestHandler {
  return (req, res, next) => {
    // The request target is read now: Express rewrites req.url while routing.
    const { method, originalUrl, httpVersion } = req
    const address = req.socket.remoteAddress ?? '-'
    res.on('finish', () => {
      logger.info(`${address} - "${method} ${originalUrl} HTTP/${httpVersion}" ${res.statusCode}`)
    })
    next()
  }
}
