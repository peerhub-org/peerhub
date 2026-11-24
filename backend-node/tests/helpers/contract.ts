import { readFileSync } from 'node:fs'
import type { Express } from 'express'
import request from 'supertest'
import { expect } from 'vitest'

interface Step {
  method: string
  path: string
  headers?: Record<string, string>
}

interface RecordedResponse {
  status: number
  headers?: Record<string, string>
  json?: unknown
  text?: string
}

const load = <T>(file: string): T =>
  JSON.parse(readFileSync(new URL(`../../contract/${file}`, import.meta.url), 'utf8')) as T

const cases = load<{ name: string; steps: Step[] }[]>('cases.json')
const recorded = load<{ name: string; responses: RecordedResponse[] }[]>('reference/responses.json')
const openapi = load<{ paths: Record<string, Record<string, unknown>> }>('reference/openapi.json')

const RECORDED_HEADERS = ['content-type', 'www-authenticate', 'allow', 'location', 'vary']

/** Every operation of the API, static paths first. */
export const operations = Object.entries(openapi.paths)
  .flatMap(([path, methods]) =>
    Object.keys(methods).map((method) => ({
      method: method.toUpperCase(),
      path: path.replace(/\{(\w+)\}/g, ':$1'),
    })),
  )
  .sort((a, b) => a.path.split(':').length - b.path.split(':').length)

export const CONTRACT_ORIGIN = 'http://localhost:5173'

/** Run steps of a contract case and compare them with what the Python backend answered. */
export async function expectSameAsPython(
  app: Express,
  name: string,
  only?: number[],
): Promise<void> {
  const steps = cases.find((c) => c.name === name)?.steps
  const responses = recorded.find((c) => c.name === name)?.responses
  if (!steps || !responses) throw new Error(`Unknown contract case: ${name}`)
  expect(responses).toHaveLength(steps.length)

  for (const [i, step] of steps.entries()) {
    if (only && !only.includes(i)) continue
    const wanted = responses[i]!
    const method = step.method.toLowerCase() as 'get'
    const response = await request(app)
      [method](step.path)
      .redirects(0)
      .set({ Host: 'test', ...step.headers })
      // Read every body as text: the recorded kind decides how to compare it.
      .buffer(true)
      .parse((res, done) => {
        let data = ''
        res.on('data', (chunk: Buffer) => (data += chunk.toString()))
        res.on('end', () => done(null, data))
      })
    const raw: unknown = response.body
    const body = typeof raw === 'string' && raw !== '' ? raw : undefined

    const headers = Object.fromEntries(
      Object.entries(response.headers as Record<string, string>)
        .filter(([key]) => RECORDED_HEADERS.includes(key) || key.startsWith('access-control-'))
        .sort(([a], [b]) => (a < b ? -1 : 1)),
    )
    const label = `${name} #${i}: ${step.method} ${step.path}`
    expect(response.status, label).toBe(wanted.status)
    expect(headers, label).toEqual(wanted.headers ?? {})
    if (wanted.json) expect(JSON.parse(body ?? 'null'), label).toEqual(wanted.json)
    else expect(body, label).toEqual(wanted.text)
  }
}
