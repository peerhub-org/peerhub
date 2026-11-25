import axios, { AxiosError } from 'axios'

export function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error)
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const detail = detailMessage((error.response?.data as { detail?: unknown })?.detail)
    if (detail) return detail
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}

/** The API sends text, or a list of problems when the request is not valid. */
function detailMessage(detail: unknown): string | undefined {
  if (typeof detail === 'string') return detail
  if (!Array.isArray(detail)) return undefined
  const messages = detail
    .map((problem: { msg?: unknown } | null) => problem?.msg)
    .filter((message): message is string => typeof message === 'string')
    .map((message) => message.replace(/^Value error, /, ''))
  return messages.join('. ') || undefined
}
