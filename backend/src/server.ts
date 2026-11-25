import { once } from 'node:events'
import { createServer, type RequestListener, type Server } from 'node:http'

const SHUTDOWN_TIMEOUT_MS = 10_000

export async function startServer(
  app: RequestListener,
  port: number,
  host = '0.0.0.0',
): Promise<Server> {
  const server = createServer(app)
  server.listen(port, host)
  await once(server, 'listening')
  return server
}

/** Stop accepting connections, wait for requests in flight and then cut what is left. */
export async function stopServer(server: Server, timeoutMs = SHUTDOWN_TIMEOUT_MS): Promise<void> {
  const timer = setTimeout(() => server.closeAllConnections(), timeoutMs)
  try {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
      server.closeIdleConnections()
    })
  } finally {
    clearTimeout(timer)
  }
}
