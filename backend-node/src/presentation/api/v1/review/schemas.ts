import { z } from 'zod'
import type { ReviewSuggestion } from '../../../../application/reviews/use_cases/get_suggestions.ts'
import { ReviewStatus, Role } from '../../../../domain/reviews/entities/review.ts'
import { sanitizeComment } from '../../../../domain/reviews/services/comment_sanitizer.ts'
import type { ReviewWithUsername } from '../../../../domain/reviews/value_objects/review_with_username.ts'
import {
  DEFAULT_PAGE_SIZE,
  MAX_COMMENT_LENGTH,
  MAX_PAGE_SIZE,
} from '../../../../domain/shared/constants.ts'
import { bodyBoolean, maxCodePoints, queryInt, type PydanticParams } from '../../validation.ts'
import {
  dateTime,
  hiddenByRole,
  reviewStatus,
  role,
  storedId,
  toDateTime,
} from '../shared/schemas.ts'

const comment = z
  .string()
  .superRefine(maxCodePoints(MAX_COMMENT_LENGTH))
  .meta({ maxLength: MAX_COMMENT_LENGTH })

export const createOrUpdateReviewRequest = z
  .object({
    reviewed_username: z.string(),
    status: reviewStatus,
    comment: comment.nullable().optional(),
    anonymous: bodyBoolean().default(false).meta({ type: 'boolean' }),
  })
  .refine(hasRequiredComment, {
    path: ['comment'],
    message: 'Value error, Comment is required',
    params: { type: 'value_error', ctx: { error: {} } } satisfies PydanticParams,
    // Reported together with problems in other fields
    when: () => true,
  })
  .meta({ id: 'CreateOrUpdateReviewRequest' })

/** A comment left out is accepted here, and refused later by the domain. */
function hasRequiredComment(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return true
  const { status, comment: given } = body as { status?: unknown; comment?: unknown }
  if (status !== ReviewStatus.COMMENT || given === undefined) return true
  if (given === null) return false
  // Values that are not valid comments have an issue of their own.
  if (!comment.safeParse(given).success) return true
  return sanitizeComment(given as string) !== null
}

export const toggleCommentHiddenRequest = z
  .object({ hidden: bodyBoolean().meta({ type: 'boolean' }) })
  .meta({ id: 'ToggleCommentHiddenRequest' })

export const reviewsQuery = z.object({
  limit: queryInt({ default: DEFAULT_PAGE_SIZE, min: 1, max: MAX_PAGE_SIZE }),
  offset: queryInt({ default: 0, min: 0 }),
  // Task 56: any text is accepted.
  status: z.string().optional(),
})

export const suggestionsQuery = z.object({ limit: queryInt({ default: 4, min: 1, max: 16 }) })

export const reviewResponse = z
  .object({
    id: z.string(),
    reviewer_uuid: z.uuid().nullable(),
    reviewer_username: z.string().nullable(),
    reviewer_avatar_url: z.string().nullable(),
    reviewed_username: z.string(),
    status: reviewStatus,
    comment: z.string().nullable(),
    anonymous: z.boolean(),
    comment_hidden: z.boolean(),
    comment_hidden_by: role.nullable(),
    created_at: dateTime,
    updated_at: dateTime,
  })
  .meta({ id: 'ReviewResponse' })

type ReviewResponse = z.output<typeof reviewResponse>

/** The review as its author sees it, with full identity and comment. */
export function toOwnReviewResponse({
  review,
  reviewerUsername,
  reviewerAvatarUrl,
}: ReviewWithUsername): ReviewResponse {
  return {
    id: storedId(review),
    reviewer_uuid: review.reviewerUuid,
    reviewer_username: reviewerUsername,
    reviewer_avatar_url: reviewerAvatarUrl,
    reviewed_username: review.reviewedUsername,
    status: review.status,
    comment: review.comment,
    anonymous: review.anonymous,
    comment_hidden: review.commentHidden,
    comment_hidden_by: hiddenByRole(review),
    created_at: toDateTime(review.createdAt),
    updated_at: toDateTime(review.updatedAt),
  }
}

export interface Viewer {
  isPageOwner: boolean
  isModerator: boolean
}

/** The review as others see it: anonymous authors and hidden comments are left out. */
export function toReviewResponse(
  item: ReviewWithUsername,
  viewer: Viewer = { isPageOwner: false, isModerator: false },
): ReviewResponse {
  const response = toOwnReviewResponse(item)
  if (!canSeeComment(response, viewer)) response.comment = null
  if (response.anonymous) {
    response.reviewer_uuid = null
    response.reviewer_username = null
    response.reviewer_avatar_url = null
  }
  return response
}

/** Owners still see what they hid, and moderators what moderators hid. */
function canSeeComment(response: ReviewResponse, viewer: Viewer): boolean {
  if (!response.comment_hidden) return true
  return response.comment_hidden_by === Role.USER ? viewer.isPageOwner : viewer.isModerator
}

export const paginatedReviewResponse = z
  .object({ items: z.array(reviewResponse), has_more: z.boolean() })
  .meta({ id: 'PaginatedReviewResponse' })

export const reviewerSummaryResponse = z
  .object({
    id: z.string(),
    reviewer_uuid: z.uuid().nullable(),
    reviewer_username: z.string().nullable(),
    reviewer_avatar_url: z.string().nullable(),
    reviewed_username: z.string(),
    status: reviewStatus,
    anonymous: z.boolean(),
    updated_at: dateTime,
  })
  .meta({ id: 'ReviewerSummaryResponse' })

/** Reviewer for the sidebar, without comment. Anonymous authors are left out. */
export function toReviewerSummaryResponse(
  item: ReviewWithUsername,
): z.output<typeof reviewerSummaryResponse> {
  const response = toReviewResponse(item)
  return {
    id: response.id,
    reviewer_uuid: response.reviewer_uuid,
    reviewer_username: response.reviewer_username,
    reviewer_avatar_url: response.reviewer_avatar_url,
    reviewed_username: response.reviewed_username,
    status: response.status,
    anonymous: response.anonymous,
    updated_at: response.updated_at,
  }
}

export const reviewSuggestionResponse = z
  .object({ username: z.string(), avatar_url: z.string().nullable() })
  .meta({ id: 'ReviewSuggestionResponse' })

export function toReviewSuggestionResponse(
  suggestion: ReviewSuggestion,
): z.output<typeof reviewSuggestionResponse> {
  return { username: suggestion.username, avatar_url: suggestion.avatarUrl }
}
