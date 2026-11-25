import { once } from 'node:events'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { isDeepStrictEqual } from 'node:util'
import type { GitHubUrls } from '../../src/infrastructure/github/external/github_client.ts'

interface StubRoute {
  method: string
  path: string
  token?: string
  form?: Record<string, string>
  query?: Record<string, string>
  status: number
  body: unknown
}

const routes = JSON.parse(
  readFileSync(new URL('../fixtures/github.json', import.meta.url), 'utf8'),
) as StubRoute[]

export interface GitHubStub {
  urls: GitHubUrls
  /** Calls that no route answers */
  unmatched: string[]
  close(): void
}

/** GitHub, as described in tests/fixtures/github.json. */
export async function startGitHubStub(): Promise<GitHubStub> {
  const unmatched: string[] = []
  const server = createServer((req, res) => {
    let raw = ''
    req.on('data', (chunk: Buffer) => (raw += chunk.toString()))
    req.on('end', () => {
      const url = new URL(req.url!, 'http://stub')
      const form = Object.fromEntries(new URLSearchParams(raw))
      const query = Object.fromEntries(url.searchParams)
      const token = req.headers.authorization?.replace('Bearer ', '')
      const route = routes.find(
        (r) =>
          r.method === req.method &&
          r.path === url.pathname &&
          (r.token === undefined || r.token === token) &&
          Object.entries(r.form ?? {}).every(([key, value]) => form[key] === value) &&
          (r.query === undefined || isDeepStrictEqual(r.query, query)),
      )
      if (!route) unmatched.push(`${req.method} ${req.url}`)
      res.writeHead(route?.status ?? 599, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(route?.body ?? {}))
    })
  }).listen(0, '127.0.0.1')
  await once(server, 'listening')
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  return {
    urls: { api: base, oauth: `${base}/login/oauth/access_token` },
    unmatched,
    close() {
      server.closeAllConnections()
      server.close()
    },
  }
}
