import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useInfiniteReviews } from './useInfiniteReviews'
import { PaginatedReviews, Review } from '@domains/reviews/application/interfaces/Review'
import { ReviewRepository } from '@domains/reviews/application/interfaces/ReviewRepository'
import { createWrapper } from '@test/queryTestUtils'

const makeReview = (id: string, status: Review['status'] = 'approve'): Review => ({
  id,
  reviewer_uuid: 'uuid',
  reviewer_username: 'reviewer',
  reviewer_avatar_url: null,
  reviewed_username: 'target',
  status,
  comment: 'comment',
  anonymous: false,
  comment_hidden: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
})

describe('useInfiniteReviews', () => {
  let mockRepo: ReviewRepository

  beforeEach(() => {
    vi.restoreAllMocks()
    // Mock IntersectionObserver
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn()
        disconnect = vi.fn()
        unobserve = vi.fn()
      },
    )

    mockRepo = {
      getReviews: vi.fn(),
      toggleCommentHidden: vi.fn(),
    }
  })

  const initialData: PaginatedReviews = {
    items: [makeReview('r1'), makeReview('r2')],
    has_more: true,
  }

  it('initializes from initialData', () => {
    const { result } = renderHook(() => useInfiniteReviews('target', initialData, mockRepo), {
      wrapper: createWrapper(),
    })

    expect(result.current.reviews).toEqual(initialData.items)
    expect(result.current.hasMore).toBe(true)
    expect(result.current.activeTab).toBe('all')
  })

  it('fetches reviews on tab change', async () => {
    const tabData: PaginatedReviews = {
      items: [makeReview('r3', 'comment')],
      has_more: false,
    }
    vi.mocked(mockRepo.getReviews).mockResolvedValue(tabData)

    const { result } = renderHook(() => useInfiniteReviews('target', initialData, mockRepo), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.handleTabChange(null, 'comment')
    })

    expect(result.current.activeTab).toBe('comment')
    await waitFor(() => {
      expect(result.current.reviews).toEqual(tabData.items)
      expect(result.current.hasMore).toBe(false)
    })
    expect(mockRepo.getReviews).toHaveBeenCalledWith('target', expect.any(Number), 0, 'comment')
  })

  it('passes undefined status for "all" tab', async () => {
    vi.mocked(mockRepo.getReviews).mockResolvedValue({ items: [], has_more: false })

    const { result } = renderHook(() => useInfiniteReviews('target', initialData, mockRepo), {
      wrapper: createWrapper(),
    })

    // Change to comment tab first, then back to all
    await act(async () => {
      await result.current.handleTabChange(null, 'comment')
    })
    await act(async () => {
      await result.current.handleTabChange(null, 'all')
    })

    expect(mockRepo.getReviews).toHaveBeenLastCalledWith('target', expect.any(Number), 0, undefined)
  })

  it('toggles comment hidden status', async () => {
    vi.mocked(mockRepo.toggleCommentHidden).mockResolvedValue({
      id: 'r1',
      comment_hidden: true,
    })

    const { result } = renderHook(() => useInfiniteReviews('target', initialData, mockRepo), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.handleToggleHidden('r1', true)
    })

    expect(result.current.reviews[0].comment_hidden).toBe(true)
    expect(result.current.reviews[1].comment_hidden).toBe(false)
  })

  it('handles tab change errors gracefully', async () => {
    vi.mocked(mockRepo.getReviews).mockRejectedValue(new Error('Failed'))

    const { result } = renderHook(() => useInfiniteReviews('target', initialData, mockRepo), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.handleTabChange(null, 'approve')
    })

    expect(result.current.reviews).toEqual([])
    expect(result.current.hasMore).toBe(false)
  })
})
