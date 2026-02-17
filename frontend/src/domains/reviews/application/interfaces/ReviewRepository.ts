import { PaginatedReviews } from '@domains/reviews/application/interfaces/Review'

export interface ReviewRepository {
  getReviews: (
    username: string,
    limit: number,
    offset: number,
    status?: string,
  ) => Promise<PaginatedReviews>
  toggleCommentHidden: (
    reviewId: string,
    hidden: boolean,
  ) => Promise<{ id: string; comment_hidden: boolean }>
}
