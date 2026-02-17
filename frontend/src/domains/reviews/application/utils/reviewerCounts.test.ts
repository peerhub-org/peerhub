import { describe, it, expect } from 'vitest'
import { getReviewerCounts } from './reviewerCounts'
import { ReviewerSummary } from '@domains/reviews/application/interfaces/Review'

const makeReviewer = (status: ReviewerSummary['status']): ReviewerSummary => ({
  id: `r-${Math.random()}`,
  reviewer_uuid: 'uuid',
  reviewer_username: 'user',
  reviewer_avatar_url: null,
  reviewed_username: 'target',
  status,
  anonymous: false,
  updated_at: '2025-01-01T00:00:00Z',
})

describe('getReviewerCounts', () => {
  it('counts each status correctly', () => {
    const reviewers = [
      makeReviewer('approve'),
      makeReviewer('approve'),
      makeReviewer('request_change'),
      makeReviewer('comment'),
      makeReviewer('comment'),
      makeReviewer('comment'),
    ]

    const counts = getReviewerCounts(reviewers)
    expect(counts.approve).toBe(2)
    expect(counts.requestChange).toBe(1)
    expect(counts.comment).toBe(3)
    expect(counts.total).toBe(6)
  })

  it('returns zeros for empty array', () => {
    const counts = getReviewerCounts([])
    expect(counts).toEqual({ approve: 0, requestChange: 0, comment: 0, total: 0 })
  })
})
