import { ReviewRepository } from '@domains/reviews/application/interfaces/ReviewRepository'
import reviewService from '@domains/reviews/application/services/reviewService'

export const reviewRepository: ReviewRepository = {
  getReviews: (username, limit, offset, status) =>
    reviewService.getReviews(username, limit, offset, status),
  toggleCommentHidden: (reviewId, hidden) => reviewService.toggleCommentHidden(reviewId, hidden),
}
