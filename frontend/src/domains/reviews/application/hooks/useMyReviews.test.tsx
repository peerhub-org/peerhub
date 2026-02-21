import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMyReviews } from './useMyReviews'
import reviewService from '@domains/reviews/application/services/reviewService'
import { Review } from '@domains/reviews/application/interfaces/Review'
import { createWrapper } from '@test/queryTestUtils'

vi.mock('@domains/reviews/application/services/reviewService', () => ({
  default: {
    getMyReviews: vi.fn(),
  },
}))

const makeReview = (overrides: Partial<Review> = {}): Review => ({
  id: 'review-1',
  reviewer_uuid: 'uuid-1',
  reviewer_username: 'testuser',
  reviewer_avatar_url: 'https://example.com/avatar.png',
  reviewed_username: 'target',
  status: 'approve',
  comment: 'Great!',
  anonymous: false,
  comment_hidden: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

describe('useMyReviews', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('uses initialMyReviewIds when provided', () => {
    const initialIds = new Set(['r1', 'r2'])

    const { result } = renderHook(() => useMyReviews('testuser', initialIds, 'target'), {
      wrapper: createWrapper(),
    })

    expect(result.current.myReviewIds).toBe(initialIds)
    expect(result.current.myReviewsLoading).toBe(false)
    expect(reviewService.getMyReviews).not.toHaveBeenCalled()
  })

  it('fetches reviews when no initialMyReviewIds', async () => {
    const myReviews = [
      makeReview({ id: 'r1', reviewed_username: 'target' }),
      makeReview({ id: 'r2', reviewed_username: 'other' }),
    ]
    vi.mocked(reviewService.getMyReviews).mockResolvedValue(myReviews)

    const { result } = renderHook(() => useMyReviews('testuser', undefined, 'target'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.myReviewsLoading).toBe(false)
    })

    expect(result.current.myReviewIds).toEqual(new Set(['r1', 'r2']))
  })

  it('finds existingReview for the profile', async () => {
    const matchingReview = makeReview({ id: 'r1', reviewed_username: 'target' })
    vi.mocked(reviewService.getMyReviews).mockResolvedValue([matchingReview])

    const { result } = renderHook(() => useMyReviews('testuser', undefined, 'target'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.existingReview).toEqual(matchingReview)
    })
  })

  it('sets currentUserInfo from first review', async () => {
    const review = makeReview({
      reviewer_username: 'testuser',
      reviewer_avatar_url: 'https://example.com/me.png',
    })
    vi.mocked(reviewService.getMyReviews).mockResolvedValue([review])

    const { result } = renderHook(() => useMyReviews('testuser', undefined, 'target'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.currentUserInfo).toEqual({
        username: 'testuser',
        avatarUrl: 'https://example.com/me.png',
      })
    })
  })

  it('handles errors gracefully', async () => {
    vi.mocked(reviewService.getMyReviews).mockRejectedValue(new Error('Failed'))

    const { result } = renderHook(() => useMyReviews('testuser', undefined, 'target'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.myReviewsLoading).toBe(false)
    })

    expect(result.current.myReviewIds).toEqual(new Set())
    expect(result.current.existingReview).toBeUndefined()
    expect(result.current.currentUserInfo).toBeNull()
  })

  it('does not fetch when currentUsername is undefined', () => {
    const { result } = renderHook(() => useMyReviews(undefined, undefined, 'target'), {
      wrapper: createWrapper(),
    })

    expect(result.current.myReviewsLoading).toBe(false)
    expect(reviewService.getMyReviews).not.toHaveBeenCalled()
  })
})
