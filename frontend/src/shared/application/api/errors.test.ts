import { describe, it, expect } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { getErrorMessage } from './errors'

describe('getErrorMessage', () => {
  it('extracts detail from axios error response', () => {
    const error = new AxiosError('Request failed', '400', undefined, undefined, {
      data: { detail: 'Username already exists' },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
    })
    expect(getErrorMessage(error)).toBe('Username already exists')
  })

  const validationError = (detail: unknown) =>
    new AxiosError('Request failed', '422', undefined, undefined, {
      data: { detail },
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: { headers: new AxiosHeaders() },
    })

  it('joins the messages of a validation error', () => {
    const error = validationError([
      { type: 'missing', loc: ['body', 'status'], msg: 'Field required' },
      { type: 'value_error', loc: ['body', 'comment'], msg: 'Value error, Comment is required' },
    ])
    expect(getErrorMessage(error)).toBe('Field required. Comment is required')
  })

  it('always returns text, whatever the detail', () => {
    for (const detail of [[], [{}], [null], ['x'], {}, 42, null, ''])
      expect(getErrorMessage(validationError(detail))).toBe('Request failed')
  })

  it('falls back to error message when axios error has no detail', () => {
    const error = new AxiosError('Network Error')
    expect(getErrorMessage(error)).toBe('Network Error')
  })

  it('returns message from generic Error', () => {
    const error = new Error('Something broke')
    expect(getErrorMessage(error)).toBe('Something broke')
  })

  it('returns default message for unknown error', () => {
    expect(getErrorMessage('some string')).toBe('An unexpected error occurred')
    expect(getErrorMessage(42)).toBe('An unexpected error occurred')
    expect(getErrorMessage(null)).toBe('An unexpected error occurred')
  })
})
