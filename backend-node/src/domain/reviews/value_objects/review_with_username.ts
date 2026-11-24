import type { Review } from '../entities/review.ts'

/** Review with resolved reviewer username and avatar. */
export interface ReviewWithUsername {
  review: Review
  reviewerUsername: string
  reviewerAvatarUrl: string | null
}
