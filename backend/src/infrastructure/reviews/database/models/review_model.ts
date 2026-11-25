import type { Binary, ObjectId } from 'mongodb'
import type { ReviewStatus } from '../../../../domain/reviews/entities/review.ts'

export const REVIEWS = 'reviews'

/** Optional fields may be missing in documents written by older versions. */
export interface ReviewDocument {
  _id: ObjectId
  reviewer_uuid: Binary
  reviewed_username: string
  status: ReviewStatus
  comment?: string | null
  anonymous?: boolean
  created_at: Date
  updated_at: Date
  comment_hidden?: boolean
  comment_hidden_by?: string | null
}
