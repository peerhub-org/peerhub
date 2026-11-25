import type { RequestHandler } from 'express'
import { ipKeyGenerator, rateLimit as expressRateLimit } from 'express-rate-limit'
import type { RateLimit } from '../../../infrastructure/shared/constants.ts'
import { sendJson } from '../responses.ts'

const WINDOW_MS: Record<RateLimit['per'], number> = { minute: 60_000, hour: 3_600_000 }

/** Fixed window per client address and path, kept in memory. */
export function rateLimit({ limit, per }: RateLimit): RequestHandler {
  return expressRateLimit({
    windowMs: WINDOW_MS[per],
    limit,
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? '127.0.0.1')} ${req.path}`,
    handler: (_req, res) => {
      sendJson(res, 429, { error: `Rate limit exceeded: ${limit} per 1 ${per}` })
    },
    // The address comes from the connection unless "trust proxy" is set (task 39).
    validate: { xForwardedForHeader: false, forwardedHeader: false },
  })
}
