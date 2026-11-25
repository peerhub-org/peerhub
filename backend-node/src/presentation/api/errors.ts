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

/** One problem in a request, in the format of Pydantic. */
export interface ValidationIssue {
  type: string
  loc: (string | number)[]
  msg: string
  input: unknown
  ctx?: Record<string, unknown>
}

/** Rendered as a 422 with {"detail": issues}. */
export class RequestValidationError extends Error {
  readonly issues: ValidationIssue[]

  constructor(issues: ValidationIssue[]) {
    super('Request validation failed')
    this.name = 'RequestValidationError'
    this.issues = issues
  }
}
