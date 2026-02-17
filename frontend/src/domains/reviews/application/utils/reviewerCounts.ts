import { ReviewerSummary } from '@domains/reviews/application/interfaces/Review'

export interface ReviewerCounts {
  approve: number
  requestChange: number
  comment: number
  total: number
}

export function getReviewerCounts(reviewers: ReviewerSummary[]): ReviewerCounts {
  const approve = reviewers.filter((r) => r.status === 'approve').length
  const requestChange = reviewers.filter((r) => r.status === 'request_change').length
  const comment = reviewers.filter((r) => r.status === 'comment').length
  return { approve, requestChange, comment, total: reviewers.length }
}
