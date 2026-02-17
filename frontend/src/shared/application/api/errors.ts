import axios, { AxiosError } from 'axios'

export function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error)
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string })?.detail
    if (detail) return detail
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}
