import { describe, it, expect } from 'vitest'
import reviewService from './reviewService'

describe('ReviewService', () => {
  it('getReviews returns paginated reviews for a user', async () => {
    const result = await reviewService.getReviews('johndoe')
    expect(result.items).toHaveLength(1)
    expect(result.items[0].reviewed_username).toBe('johndoe')
    expect(result.items[0].status).toBe('approve')
    expect(result.has_more).toBe(false)
  })

  it('getReviewers returns all reviewers for a user', async () => {
    const reviewers = await reviewService.getReviewers('johndoe')
    expect(reviewers).toHaveLength(2)
    expect(reviewers[0].reviewer_username).toBe('reviewer1')
    expect(reviewers[0].reviewed_username).toBe('johndoe')
    expect(reviewers[0].status).toBe('approve')
    expect(reviewers[1].reviewer_username).toBe('reviewer2')
    expect(reviewers[1].status).toBe('comment')
    // Reviewer summaries should not have comment field
    expect(reviewers[0]).not.toHaveProperty('comment')
    expect(reviewers[0]).not.toHaveProperty('comment_hidden')
  })

  it('getReviewSuggestions returns review suggestions', async () => {
    const reviewSuggestions = await reviewService.getReviewSuggestions()
    expect(reviewSuggestions).toHaveLength(1)
    expect(reviewSuggestions[0].username).toBe('reviewSuggestion1')
  })

  it('getMyReviews returns current user reviews', async () => {
    const reviews = await reviewService.getMyReviews()
    expect(reviews).toEqual([])
  })

  it('createReview sends review and returns it', async () => {
    const review = await reviewService.createReview({
      reviewed_username: 'johndoe',
      status: 'approve',
      comment: 'Solid work',
      anonymous: false,
    })
    expect(review.reviewed_username).toBe('johndoe')
    expect(review.status).toBe('approve')
    expect(review.comment).toBe('Solid work')
  })

  it('deleteReview completes without error', async () => {
    await expect(reviewService.deleteReview('johndoe')).resolves.toBeUndefined()
  })

  it('toggleCommentHidden updates visibility', async () => {
    const result = await reviewService.toggleCommentHidden('review-1', true)
    expect(result.comment_hidden).toBe(true)
  })
})
