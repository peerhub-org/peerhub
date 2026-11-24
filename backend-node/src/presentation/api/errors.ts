/** Error raised by the HTTP layer and rendered as {"detail": ...}. */
export class HttpError extends Error {
  readonly status: number
  readonly headers: Record<string, string>

  constructor(status: number, detail: string, headers: Record<string, string> = {}) {
    super(detail)
    this.name = 'HttpError'
    this.status = status
    this.headers = headers
  }
}
