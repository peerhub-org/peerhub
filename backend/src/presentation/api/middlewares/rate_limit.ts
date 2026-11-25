import { isIP } from 'node:net'
import type { Request, RequestHandler } from 'express'
import { ipKeyGenerator, rateLimit as expressRateLimit } from 'express-rate-limit'
import type { RateLimit } from '../../../infrastructure/shared/constants.ts'
import { sendJson } from '../responses.ts'

const WINDOW_MS: Record<RateLimit['per'], number> = { minute: 60_000, hour: 3_600_000 }

/** Fixed window per client address and path, kept in memory. */
export function rateLimit(
  { limit, per }: RateLimit,
  clientIpHeader: string | null,
): RequestHandler {
  return expressRateLimit({
    windowMs: WINDOW_MS[per],
    limit,
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req) => `${ipKeyGenerator(clientIp(req, clientIpHeader))} ${req.path}`,
    handler: (_req, res) => {
      sendJson(res, 429, { error: `Rate limit exceeded: ${limit} per 1 ${per}` })
    },
    // Forwarded headers are never used here, see clientIp().
    validate: { xForwardedForHeader: false, forwardedHeader: false },
  })
}

/** The connection address, unless a trusted header is configured and holds an address. */
function clientIp(req: Request, header: string | null): string {
  const value = header === null ? undefined : req.headers[header]
  if (typeof value === 'string' && isIP(value.trim()) !== 0) return value.trim()
  return req.ip ?? '127.0.0.1'
}
