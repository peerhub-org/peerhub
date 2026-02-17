import type { ReviewStatus } from '@shared/application/interfaces/ReviewStatus'

export interface ActivityFeedItem {
  review_id: string
  reviewer_uuid: string | null
  reviewer_username: string | null
  reviewer_avatar_url: string | null
  reviewed_username: string
  reviewed_user_avatar_url: string | null
  status: ReviewStatus
  comment: string | null
  anonymous: boolean
  comment_hidden: boolean
  created_at: string
  updated_at: string
}

export interface PaginatedActivityFeed {
  items: ActivityFeedItem[]
  has_more: boolean
}

export type FeedFilter = 'all' | 'mine' | 'watching'
