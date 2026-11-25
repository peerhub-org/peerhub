import type { Uuid } from '../../shared/uuid.ts'
import type { Review } from '../entities/review.ts'

/** Username lookups are case-insensitive; lists come newest first. */
export interface IReviewRepository {
  getById(reviewId: string): Promise<Review | null>
  getByReviewerAndUsername(reviewerUuid: Uuid, reviewedUsername: string): Promise<Review | null>
  /** A limit of 0 means no limit. */
  getAllForUsername(
    reviewedUsername: string,
    limit: number,
    offset: number,
    status: string | null,
  ): Promise<Review[]>
  getAllByReviewerUuid(reviewerUuid: Uuid, limit: number, offset: number): Promise<Review[]>
  getReviewCountsForUsernames(usernames: string[]): Promise<Map<string, number>>
  create(review: Review): Promise<Review>
  update(review: Review): Promise<Review>
  delete(reviewId: string): Promise<void>
  /** Returns how many reviews were deleted. */
  deleteAllByReviewerUuid(reviewerUuid: Uuid): Promise<number>
}
