import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useActivityFeed } from './useActivityFeed'
import {
  ActivityFeedItem,
  PaginatedActivityFeed,
} from '@domains/account/application/interfaces/ActivityFeed'
import { FeedRepository } from '@domains/account/application/interfaces/FeedRepository'

const makeFeedItem = (id: string): ActivityFeedItem => ({
  review_id: id,
  reviewer_uuid: 'uuid',
  reviewer_username: 'reviewer',
  reviewer_avatar_url: null,
  reviewed_username: 'target',
  reviewed_user_avatar_url: null,
  status: 'approve',
  comment: 'Great!',
  anonymous: false,
  comment_hidden: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
})

describe('useActivityFeed', () => {
  let mockRepo: FeedRepository

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn()
        disconnect = vi.fn()
        unobserve = vi.fn()
      },
    )

    mockRepo = {
      getActivityFeed: vi.fn(),
    }
  })

  it('loads feed on mount', async () => {
    const feed: PaginatedActivityFeed = {
      items: [makeFeedItem('f1'), makeFeedItem('f2')],
      has_more: true,
    }
    vi.mocked(mockRepo.getActivityFeed).mockResolvedValue(feed)

    const { result } = renderHook(() => useActivityFeed(mockRepo))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.feedItems).toEqual(feed.items)
    expect(result.current.hasMore).toBe(true)
    expect(result.current.activeTab).toBe('all')
    expect(mockRepo.getActivityFeed).toHaveBeenCalledWith('all', expect.any(Number), 0)
  })

  it('switches tabs', async () => {
    const allFeed: PaginatedActivityFeed = { items: [makeFeedItem('f1')], has_more: false }
    const mineFeed: PaginatedActivityFeed = { items: [makeFeedItem('f2')], has_more: false }

    vi.mocked(mockRepo.getActivityFeed)
      .mockResolvedValueOnce(allFeed) // initial load
      .mockResolvedValueOnce(mineFeed) // tab switch

    const { result } = renderHook(() => useActivityFeed(mockRepo))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.handleTabChange(null, 'mine')
    })

    expect(result.current.activeTab).toBe('mine')
    expect(result.current.feedItems).toEqual(mineFeed.items)
    expect(mockRepo.getActivityFeed).toHaveBeenCalledWith('mine', expect.any(Number), 0)
  })

  it('handles load error', async () => {
    vi.mocked(mockRepo.getActivityFeed).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useActivityFeed(mockRepo))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.feedItems).toEqual([])
    expect(result.current.hasMore).toBe(false)
    expect(result.current.error?.message).toBe('Network error')
  })

  it('cancels stale tab requests', async () => {
    let resolveFirst: (value: PaginatedActivityFeed) => void
    let resolveSecond: (value: PaginatedActivityFeed) => void

    vi.mocked(mockRepo.getActivityFeed)
      .mockImplementationOnce(
        () =>
          new Promise((r) => {
            resolveFirst = r
          }),
      ) // initial 'all'
      .mockImplementationOnce(
        () =>
          new Promise((r) => {
            resolveSecond = r
          }),
      ) // 'mine' tab

    const { result } = renderHook(() => useActivityFeed(mockRepo))

    // Switch tab before initial load completes
    act(() => {
      result.current.handleTabChange(null, 'mine')
    })

    // Resolve second first
    await act(async () => {
      resolveSecond!({ items: [makeFeedItem('mine-1')], has_more: false })
    })

    // Resolve first (stale) — should be ignored
    await act(async () => {
      resolveFirst!({ items: [makeFeedItem('all-1')], has_more: true })
    })

    expect(result.current.feedItems).toEqual([makeFeedItem('mine-1')])
    expect(result.current.activeTab).toBe('mine')
  })
})
