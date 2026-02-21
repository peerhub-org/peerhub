import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useProfileReviewers } from './useProfileReviewers'
import reviewService from '@domains/reviews/application/services/reviewService'
import { ReviewerSummary } from '@domains/reviews/application/interfaces/Review'
import { createWrapper } from '@test/queryTestUtils'

vi.mock('@domains/reviews/application/services/reviewService', () => ({
  default: {
    getReviewers: vi.fn(),
  },
}))

const mockReviewers: ReviewerSummary[] = [
  {
    id: 'r1',
    reviewer_uuid: 'u1',
    reviewer_username: 'alice',
    reviewer_avatar_url: null,
    reviewed_username: 'bob',
    status: 'approve',
    anonymous: false,
    updated_at: '2025-01-01T00:00:00Z',
  },
]

describe('useProfileReviewers', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('fetches reviewers on mount', async () => {
    vi.mocked(reviewService.getReviewers).mockResolvedValue(mockReviewers)

    const { result } = renderHook(() => useProfileReviewers('bob'), { wrapper: createWrapper() })

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.reviewers).toEqual(mockReviewers)
    expect(result.current.error).toBeNull()
    expect(reviewService.getReviewers).toHaveBeenCalledWith('bob')
  })

  it('handles errors', async () => {
    vi.mocked(reviewService.getReviewers).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useProfileReviewers('bob'), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.reviewers).toEqual([])
    expect(result.current.error?.message).toBe('Network error')
  })

  it('refetches data', async () => {
    vi.mocked(reviewService.getReviewers)
      .mockResolvedValueOnce(mockReviewers)
      .mockResolvedValueOnce([])

    const { result } = renderHook(() => useProfileReviewers('bob'), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.reviewers).toEqual(mockReviewers)
    })

    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.reviewers).toEqual([])
    })
  })

  it('refetches when username changes', async () => {
    vi.mocked(reviewService.getReviewers).mockResolvedValue(mockReviewers)

    const { result, rerender } = renderHook(({ username }) => useProfileReviewers(username), {
      initialProps: { username: 'bob' },
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    rerender({ username: 'alice' })

    await waitFor(() => {
      expect(reviewService.getReviewers).toHaveBeenCalledWith('alice')
    })
  })
})
