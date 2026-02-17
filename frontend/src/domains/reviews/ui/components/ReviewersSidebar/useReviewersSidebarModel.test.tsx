import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import theme from '@shared/ui/foundations/theme'
import { useReviewersSidebarModel } from './useReviewersSidebarModel'
import reviewService from '@domains/reviews/application/services/reviewService'
import { ReviewerSummary } from '@domains/reviews/application/interfaces/Review'
import { STATUS_DOT_COUNT } from '@shared/application/config/appConstants'

vi.mock('@domains/reviews/application/services/reviewService', () => ({
  default: {
    deleteReview: vi.fn(),
  },
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
)

describe('useReviewersSidebarModel', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('sorts current user reviews first and by updated_at desc', () => {
    const reviewers: ReviewerSummary[] = [
      {
        id: 'r1',
        reviewer_uuid: 'u1',
        reviewer_username: 'bob',
        reviewer_avatar_url: null,
        reviewed_username: 'alice',
        status: 'comment',
        anonymous: false,
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'r2',
        reviewer_uuid: 'u2',
        reviewer_username: 'me',
        reviewer_avatar_url: null,
        reviewed_username: 'alice',
        status: 'approve',
        anonymous: false,
        updated_at: '2025-01-02T00:00:00Z',
      },
      {
        id: 'r3',
        reviewer_uuid: 'u3',
        reviewer_username: 'carol',
        reviewer_avatar_url: null,
        reviewed_username: 'alice',
        status: 'request_change',
        anonymous: false,
        updated_at: '2025-01-03T00:00:00Z',
      },
    ]

    const myReviewIds = new Set(['r2'])

    const { result } = renderHook(() => useReviewersSidebarModel({ reviewers, myReviewIds }), {
      wrapper,
    })

    expect(result.current.sortedReviews[0].id).toBe('r2')
    expect(result.current.sortedReviews[1].id).toBe('r3')
    expect(result.current.sortedReviews[2].id).toBe('r1')
  })

  it('computes circle colors with a fixed dot count', () => {
    const reviewers: ReviewerSummary[] = [
      {
        id: 'r1',
        reviewer_uuid: 'u1',
        reviewer_username: 'bob',
        reviewer_avatar_url: null,
        reviewed_username: 'alice',
        status: 'approve',
        anonymous: false,
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'r2',
        reviewer_uuid: 'u2',
        reviewer_username: 'carol',
        reviewer_avatar_url: null,
        reviewed_username: 'alice',
        status: 'request_change',
        anonymous: false,
        updated_at: '2025-01-02T00:00:00Z',
      },
      {
        id: 'r3',
        reviewer_uuid: 'u3',
        reviewer_username: 'dave',
        reviewer_avatar_url: null,
        reviewed_username: 'alice',
        status: 'comment',
        anonymous: false,
        updated_at: '2025-01-03T00:00:00Z',
      },
    ]

    const { result } = renderHook(
      () => useReviewersSidebarModel({ reviewers, myReviewIds: new Set() }),
      { wrapper },
    )

    expect(result.current.circleColors).toHaveLength(STATUS_DOT_COUNT)
    expect(result.current.circleColors).toContain(theme.palette.success.main)
  })

  it('handles delete flow and calls onDeleteSuccess', async () => {
    const onDeleteSuccess = vi.fn()
    const reviewers: ReviewerSummary[] = [
      {
        id: 'r1',
        reviewer_uuid: 'u1',
        reviewer_username: 'me',
        reviewer_avatar_url: null,
        reviewed_username: 'alice',
        status: 'approve',
        anonymous: false,
        updated_at: '2025-01-02T00:00:00Z',
      },
    ]

    const { result } = renderHook(
      () => useReviewersSidebarModel({ reviewers, myReviewIds: new Set(['r1']), onDeleteSuccess }),
      { wrapper },
    )

    act(() => {
      result.current.handleDeleteClick('alice')
    })
    expect(result.current.deleteTarget).toBe('alice')

    await act(async () => {
      await result.current.handleDeleteConfirm()
    })

    expect(reviewService.deleteReview).toHaveBeenCalledWith('alice')
    expect(onDeleteSuccess).toHaveBeenCalled()
    expect(result.current.deleteTarget).toBeNull()
    expect(result.current.deleting).toBe(false)
  })
})
