import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { timeAgo, formatFullDate } from './dateFormatting'

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "at some point" for null', () => {
    expect(timeAgo(null)).toBe('at some point')
  })

  it('returns "today" for today', () => {
    expect(timeAgo('2025-06-15T10:00:00Z')).toBe('today')
  })

  it('returns "yesterday" for 1 day ago', () => {
    expect(timeAgo('2025-06-14T10:00:00Z')).toBe('yesterday')
  })

  it('returns days ago for 2-6 days', () => {
    expect(timeAgo('2025-06-12T10:00:00Z')).toBe('3 days ago')
  })

  it('returns "1 week ago" for 7-13 days', () => {
    expect(timeAgo('2025-06-08T10:00:00Z')).toBe('1 week ago')
  })

  it('returns weeks ago for 14-29 days', () => {
    expect(timeAgo('2025-05-30T10:00:00Z')).toBe('2 weeks ago')
  })

  it('returns "1 month ago" for ~30 days', () => {
    expect(timeAgo('2025-05-15T10:00:00Z')).toBe('1 month ago')
  })

  it('returns months ago for multiple months', () => {
    expect(timeAgo('2025-01-15T10:00:00Z')).toBe('5 months ago')
  })

  it('returns "1 year ago" for ~365 days', () => {
    // Need diffDays >= 365 (triggers year branch) and diffDays < 730 (so it's 1 year not 2)
    expect(timeAgo('2024-03-15T10:00:00Z')).toBe('1 year ago')
  })

  it('returns years ago for multiple years', () => {
    expect(timeAgo('2023-01-01T10:00:00Z')).toBe('2 years ago')
  })
})

describe('formatFullDate', () => {
  it('returns empty string for null', () => {
    expect(formatFullDate(null)).toBe('')
  })

  it('returns formatted date for valid input', () => {
    const result = formatFullDate('2025-06-15T14:30:00Z')
    // The exact format depends on the browser locale, but it should contain the date parts
    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(0)
  })
})
