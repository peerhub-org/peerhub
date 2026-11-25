import type { Uuid } from '../../shared/uuid.ts'
import type { Review } from '../entities/review.ts'

/** Reviews of these users, or of these other ones when written by the viewer. */
export interface ReviewFeed {
  usernames: string[]
  onlyByViewer: string[]
  viewerUuid: Uuid
}

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
  /** Most recently updated first. Reviews by unknown or deleted accounts are left out. */
  getFeed(feed: ReviewFeed, limit: number, offset: number): Promise<Review[]>
  getAllByReviewerUuid(reviewerUuid: Uuid, limit: number, offset: number): Promise<Review[]>
  /** Keyed by lowercase username. Users without reviews are left out. */
  getReviewCountsForUsernames(usernames: string[]): Promise<Map<string, number>>
  /** Throws DuplicateEntityError when the reviewer already reviewed the user. */
  create(review: Review): Promise<Review>
  update(review: Review): Promise<Review>
  delete(reviewId: string): Promise<void>
  /** Returns how many reviews were deleted. */
  deleteAllByReviewerUuid(reviewerUuid: Uuid): Promise<number>
}
