export type { ReviewStatus } from '@shared/application/interfaces/ReviewStatus'
import type { ReviewStatus } from '@shared/application/interfaces/ReviewStatus'

export interface Review {
  id: string
  reviewer_uuid: string | null
  reviewer_username: string | null
  reviewer_avatar_url: string | null
  reviewed_username: string
  status: ReviewStatus
  comment: string | null
  anonymous: boolean
  comment_hidden: boolean
  created_at: string
  updated_at: string
}

export interface PaginatedReviews {
  items: Review[]
  has_more: boolean
}

export interface ReviewerSummary {
  id: string
  reviewer_uuid: string | null
  reviewer_username: string | null
  reviewer_avatar_url: string | null
  reviewed_username: string
  status: ReviewStatus
  anonymous: boolean
  updated_at: string
}

export interface CreateReviewRequest {
  reviewed_username: string
  status: ReviewStatus
  comment?: string | null
  anonymous?: boolean
}

export interface ReviewSuggestion {
  username: string
  avatar_url: string | null
}
