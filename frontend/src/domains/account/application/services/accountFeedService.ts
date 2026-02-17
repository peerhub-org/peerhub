import axios from 'axios'
import {
  FeedFilter,
  PaginatedActivityFeed,
} from '@domains/account/application/interfaces/ActivityFeed'
import { API_BASE_URL } from '@shared/application/config/env'
import { PAGE_SIZE } from '@shared/application/config/appConstants'
import { z } from 'zod'
import { reviewStatusSchema } from '@shared/application/schemas/reviewSchemas'

const activityFeedItemSchema = z.object({
  review_id: z.string(),
  reviewer_uuid: z.string().nullable(),
  reviewer_username: z.string().nullable(),
  reviewer_avatar_url: z.string().nullable(),
  reviewed_username: z.string(),
  reviewed_user_avatar_url: z.string().nullable(),
  status: reviewStatusSchema,
  comment: z.string().nullable(),
  anonymous: z.boolean(),
  comment_hidden: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

const paginatedActivityFeedSchema = z.object({
  items: z.array(activityFeedItemSchema),
  has_more: z.boolean(),
})

class AccountFeedService {
  async getActivityFeed(
    filter: FeedFilter = 'all',
    limit = PAGE_SIZE,
    offset = 0,
  ): Promise<PaginatedActivityFeed> {
    const response = await axios.get(API_BASE_URL + 'account/feed', {
      params: { filter, limit, offset },
    })
    return paginatedActivityFeedSchema.parse(response.data)
  }
}

export default new AccountFeedService()
