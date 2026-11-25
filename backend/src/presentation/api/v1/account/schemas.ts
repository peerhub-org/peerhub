import { z } from 'zod'
import type { ActivityFeedItem } from '../../../../application/accounts/use_cases/get_activity_feed.ts'
import type { Account } from '../../../../domain/accounts/entities/account.ts'
import { queryInt } from '../../validation.ts'
import {
  dateTime,
  hiddenByRole,
  reviewStatus,
  role,
  storedId,
  toDateTime,
  toOptionalDateTime,
} from '../shared/schemas.ts'

export const accountResponse = z
  .object({
    id: z.string(),
    uuid: z.uuid(),
    username: z.string(),
    deleted_at: dateTime.nullable(),
    is_moderator: z.boolean(),
  })
  .meta({ id: 'AccountResponse' })

export function toAccountResponse(
  account: Account,
  moderators: ReadonlySet<string>,
): z.output<typeof accountResponse> {
  return {
    id: storedId(account),
    uuid: account.uuid,
    username: account.username,
    deleted_at: toOptionalDateTime(account.deletedAt),
    is_moderator: moderators.has(account.username),
  }
}

export const activityFeedQuery = z.object({
  filter: z.enum(['all', 'mine', 'watching']).default('all'),
  limit: queryInt({ default: 16, min: 1, max: 100 }),
  offset: queryInt({ default: 0, min: 0 }),
})

const activityFeedItemResponse = z
  .object({
    review_id: z.string(),
    reviewer_uuid: z.uuid().nullable(),
    reviewer_username: z.string().nullable(),
    reviewer_avatar_url: z.string().nullable(),
    reviewed_username: z.string(),
    reviewed_user_avatar_url: z.string().nullable(),
    status: reviewStatus,
    comment: z.string().nullable(),
    anonymous: z.boolean(),
    comment_hidden: z.boolean(),
    comment_hidden_by: role.nullable(),
    created_at: dateTime,
    updated_at: dateTime,
  })
  .meta({ id: 'ActivityFeedItemResponse' })

/** Anonymous authors and hidden comments are left out, whoever is looking. */
export function toActivityFeedItemResponse(
  item: ActivityFeedItem,
): z.output<typeof activityFeedItemResponse> {
  const { review } = item
  return {
    review_id: storedId(review),
    reviewer_uuid: review.anonymous ? null : review.reviewerUuid,
    reviewer_username: review.anonymous ? null : item.reviewerUsername,
    reviewer_avatar_url: review.anonymous ? null : item.reviewerAvatarUrl,
    reviewed_username: review.reviewedUsername,
    reviewed_user_avatar_url: item.reviewedUserAvatarUrl,
    status: review.status,
    comment: review.commentHidden ? null : review.comment,
    anonymous: review.anonymous,
    comment_hidden: review.commentHidden,
    comment_hidden_by: hiddenByRole(review),
    created_at: toDateTime(review.createdAt),
    updated_at: toDateTime(review.updatedAt),
  }
}

export const paginatedActivityFeedResponse = z
  .object({ items: z.array(activityFeedItemResponse), has_more: z.boolean() })
  .meta({ id: 'PaginatedActivityFeedResponse' })
