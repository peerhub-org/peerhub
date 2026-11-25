import type { Response } from 'express'

/** Send JSON with the exact content type of the API contract (no charset). */
export function sendJson(res: Response, status: number, body: unknown): void {
  const payload = Buffer.from(JSON.stringify(body))
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Length', payload.length)
  res.end(payload)
}

export function sendText(res: Response, status: number, body: string): void {
  const payload = Buffer.from(body)
  res.statusCode = status
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Content-Length', payload.length)
  res.end(payload)
}
