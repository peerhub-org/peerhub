import express, { type Request, type RequestHandler } from 'express'
import { HttpError, RequestValidationError } from '../errors.ts'

const MAX_BODY_SIZE = '1mb'

/** Reads the body, whatever its type, for parseBody(). */
export const readBody: RequestHandler = express.raw({ type: () => true, limit: MAX_BODY_SIZE })

/**
 * Parse the body as FastAPI does: only JSON is parsed, anything else stays text.
 * An absent body and a JSON null are the same.
 */
export function parseBody(req: Request): unknown {
  const raw: unknown = req.body
  if (!Buffer.isBuffer(raw) || raw.length === 0) return null

  const text = decode(raw)
  if (!/^application\/([\w.-]+\+)?json\s*(;|$)/i.test(req.headers['content-type'] ?? ''))
    return text

  return parseJson(text)
}

function decode(raw: Buffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(raw)
  } catch {
    throw new HttpError(400, 'There was an error parsing the body')
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch (error) {
    const position = /at position (\d+)/.exec((error as Error).message)?.[1]
    throw new RequestValidationError([
      {
        type: 'json_invalid',
        loc: ['body', Number(position ?? 0)],
        msg: 'JSON decode error',
        input: {},
        ctx: { error: 'Invalid JSON' },
      },
    ])
  }
}
