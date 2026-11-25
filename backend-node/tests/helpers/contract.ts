import { readFileSync } from 'node:fs'
import type { Express } from 'express'
import { BSON, type Db, type Document } from 'mongodb'
import request from 'supertest'
import { expect } from 'vitest'

export interface Step {
  method: string
  path: string
  headers?: Record<string, string>
  /** Name of the token to send */
  as?: string
  scheme?: string
  body?: unknown
  raw?: string
  comment_repeat?: [text: string, times: number]
  repeat?: number
  last_only?: boolean
}

export interface ContractCase {
  name: string
  steps: Step[]
  /** Compare what changed in the database */
  db?: boolean
  mongo_down?: boolean
  email_fails?: boolean
  flags?: { open_draft_profiles: boolean }
}

export interface RecordedResponse {
  status: number
  headers?: Record<string, string>
  json?: unknown
  text?: string
}

export interface RecordedCase {
  name: string
  responses: RecordedResponse[]
  db?: unknown
  emails?: unknown[]
}

const load = <T>(file: string): T =>
  JSON.parse(readFileSync(new URL(`../../contract/${file}`, import.meta.url), 'utf8')) as T

export const cases = load<ContractCase[]>('cases.json')
export const openapi = load<{
  paths: Record<string, Record<string, Operation>>
  components: { schemas: Record<string, Schema> }
}>('reference/openapi.json')
const recordedCases = load<RecordedCase[]>('reference/responses.json')
const fixtures = load<{
  review_ids: Record<string, string>
  collections: Record<string, Document[]>
}>('reference/fixtures.json')
export const contractTokens = load<{ secret_key: string; tokens: Record<string, string> }>(
  'reference/tokens.json',
)

export interface Schema {
  type?: string
  properties?: Record<string, Schema>
  required?: string[]
  [key: string]: unknown
}

export interface Operation {
  parameters?: { name: string; in: string; required: boolean; schema: Schema }[]
  requestBody?: unknown
  responses: Record<string, { content?: unknown }>
  security?: unknown[]
}

export function recorded(name: string): RecordedCase {
  const found = recordedCases.find((c) => c.name === name)
  if (!found) throw new Error(`Unknown contract case: ${name}`)
  return found
}

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

const RECORDED_HEADERS = ['content-type', 'www-authenticate', 'allow', 'location', 'vary']

/** Run the steps of a contract case, recording responses like the Python generator does. */
export async function runSteps(app: Express, steps: Step[]): Promise<RecordedResponse[]> {
  const responses: RecordedResponse[] = []
  for (const step of steps) {
    const times = step.repeat ?? 1
    for (let i = 0; i < times; i++) {
      const response = await runStep(app, step)
      if (!step.last_only || i === times - 1) responses.push(response)
    }
  }
  return responses
}

async function runStep(app: Express, step: Step): Promise<RecordedResponse> {
  const path = step.path.replace(/\{(\w+)\}/g, (_, key: string) => fixtures.review_ids[key]!)
  const method = step.method.toLowerCase() as 'get'
  const call = request(app)
    [method](path)
    .redirects(0)
    .set({ Host: 'test', ...step.headers })
    // Read every body as text: the content type decides how to record it.
    .buffer(true)
    .parse((res, done) => {
      let data = ''
      res.setEncoding('utf8')
      res.on('data', (chunk: string) => (data += chunk))
      res.on('end', () => done(null, data))
    })
  if (step.as)
    call.set('Authorization', `${step.scheme ?? 'Bearer'} ${contractTokens.tokens[step.as]}`)
  if (step.raw !== undefined) {
    if (!step.headers?.['Content-Type']) throw new Error('Raw bodies need a content type')
    // As text, so that supertest does not serialize it again.
    call.serialize((value) => value as string)
    call.send(step.raw)
  } else if (step.body !== undefined) {
    const [text, count] = step.comment_repeat ?? []
    const comment = text !== undefined ? { comment: text.repeat(count!) } : {}
    const body = step.comment_repeat ? { ...(step.body as object), ...comment } : step.body
    call.set('Content-Type', 'application/json').send(JSON.stringify(body))
  }
  const response = await call

  const out: RecordedResponse = { status: response.status }
  const headers = Object.entries(response.headers as Record<string, string>).filter(
    ([key]) =>
      RECORDED_HEADERS.includes(key) ||
      key.startsWith('access-control-') ||
      key.startsWith('x-ratelimit'),
  )
  if (headers.length > 0) out.headers = Object.fromEntries(headers)
  const body: unknown = response.body
  const text = typeof body === 'string' ? body : ''
  if (response.headers['content-type']?.startsWith('application/json'))
    out.json = text === '' ? null : JSON.parse(text)
  else if (text !== '') out.text = text
  return out
}

/** Run steps of a contract case and compare them with what the Python backend answered. */
export async function expectSameAsPython(
  app: Express,
  name: string,
  only?: number[],
): Promise<void> {
  const steps = cases.find((c) => c.name === name)!.steps
  for (const [i, step] of steps.entries()) {
    if (only && !only.includes(i)) continue
    const [response] = await runSteps(app, [step])
    expect(response, `${name} #${i}`).toEqual(recorded(name).responses[i])
  }
}

// --- Normalization, as in contract/generate.py ---

const known = new Set<string>(['f'.repeat(24), 'a0000000-0000-4000-8000-000000000999'])
collect(fixtures)
for (const token of Object.values(contractTokens.tokens)) {
  const sub = /"sub":"([^"]+)"/.exec(Buffer.from(token.split('.')[1]!, 'base64url').toString())
  if (sub) known.add(sub[1]!)
}

function collect(value: unknown): void {
  if (Array.isArray(value)) value.forEach(collect)
  else if (typeof value === 'object' && value !== null) Object.values(value).forEach(collect)
  else if (typeof value === 'string') {
    known.add(value)
    // The API writes milliseconds even when EJSON leaves them out.
    if (/^\d{4}-.*T.*Z$/.test(value)) known.add(new Date(value).toISOString())
  }
}

const PLACEHOLDERS: [RegExp, string][] = [
  [/^eyJ[\w-]+\.eyJ[\w-]+\.[\w-]*$/, '<jwt>'],
  [/^[0-9a-f]{24}$/, '<oid>'],
  [/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/, '<uuid>'],
  [/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/, '<date>'],
]

/** Replace values created during the run by placeholders; keep fixture values. */
export function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize)
  if (typeof value === 'object' && value !== null)
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, normalize(v)]))
  if (typeof value !== 'string' || known.has(value)) return value
  return PLACEHOLDERS.find(([pattern]) => pattern.test(value))?.[1] ?? value
}

// --- Database changes, as in contract/generate.py ---

/** What changed in relation to the fixtures, as EJSON with UUIDs of subtype 4 as text. */
export async function databaseChanges(db: Db): Promise<Record<string, unknown>> {
  const changes: Record<string, unknown> = {}
  for (const [name, before] of Object.entries(fixtures.collections)) {
    const documents = await db.collection(name).find({}).sort({ _id: 1 }).toArray()
    const after = uuidText(JSON.parse(BSON.EJSON.stringify(documents))) as Document[]
    const idOf = (document: Document) => JSON.stringify(document._id)
    const oldById = new Map(before.map((document) => [idOf(document), document]))
    const newIds = new Set(after.map(idOf))
    const change = {
      added: after.filter((document) => !oldById.has(idOf(document))),
      removed: before
        .filter((document) => !newIds.has(idOf(document)))
        .map((d) => d._id as unknown),
      changed: after.filter((document) => {
        const old = oldById.get(idOf(document))
        return old && !sameJson(old, document)
      }),
    }
    const entries = Object.entries(change).filter(([, list]) => list.length > 0)
    if (entries.length > 0) changes[name] = Object.fromEntries(entries)
  }
  return changes
}

function sameJson(a: unknown, b: unknown): boolean {
  const sorted = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(sorted)
      : typeof value === 'object' && value !== null
        ? Object.entries(value)
            .sort(([x], [y]) => (x < y ? -1 : 1))
            .map(([key, v]) => [key, sorted(v)])
        : value
  return JSON.stringify(sorted(a)) === JSON.stringify(sorted(b))
}

function uuidText(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(uuidText)
  if (typeof value !== 'object' || value === null) return value
  const binary = (value as { $binary?: { base64: string; subType: string } }).$binary
  if (binary?.subType === '04')
    return { $uuid: new BSON.UUID(Buffer.from(binary.base64, 'base64')).toHexString() }
  return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, uuidText(v)]))
}
