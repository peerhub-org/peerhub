import { z } from 'zod'
import { sanitizeComment } from '../../../../domain/reviews/services/comment_sanitizer.ts'
import { RATE_LIMIT_REVIEW_WRITE } from '../../../../infrastructure/shared/constants.ts'
import type { Container } from '../../container.ts'
import { endpoint, type Endpoint } from '../../endpoint.ts'
import {
  createOrUpdateReviewRequest,
  paginatedReviewResponse,
  reviewerSummaryResponse,
  reviewResponse,
  reviewsQuery,
  reviewSuggestionResponse,
  suggestionsQuery,
  toggleCommentHiddenRequest,
  toReviewerSummaryResponse,
  toReviewResponse,
  toReviewSuggestionResponse,
} from './schemas.ts'

export function reviewEndpoints({ useCases }: Container): Endpoint[] {
  return [
    endpoint({
      method: 'POST',
      path: '/reviews',
      tag: 'reviews',
      summary: 'Create or update a review for a user.',
      body: createOrUpdateReviewRequest,
      response: reviewResponse,
      rateLimit: RATE_LIMIT_REVIEW_WRITE,
      async handler({ body, accountUuid }) {
        const review = await useCases.createOrUpdateReview.execute({
          reviewerUuid: accountUuid,
          reviewedUsername: body.reviewed_username,
          status: body.status,
          comment: sanitizeComment(body.comment ?? null),
          anonymous: body.anonymous,
        })
        return toReviewResponse(review)
      },
    }),

    endpoint({
      method: 'GET',
      path: '/reviews/suggestions',
      tag: 'reviews',
      summary: 'Get review suggestions to visit based on GitHub following list.',
      query: suggestionsQuery,
      response: z.array(reviewSuggestionResponse),
      async handler({ query, accountUuid }) {
        const suggestions = await useCases.getSuggestions.execute(accountUuid, query.limit)
        return suggestions.map(toReviewSuggestionResponse)
      },
    }),

    endpoint({
      method: 'GET',
      path: '/reviews/:username/reviewers',
      tag: 'reviews',
      summary: 'Get all reviewers for a user (no pagination, for sidebar display).',
      response: z.array(reviewerSummaryResponse),
      async handler({ params, accountUuid }) {
        const reviewers = await useCases.getReviewers.execute(params.username!, accountUuid)
        return reviewers.map(toReviewerSummaryResponse)
      },
    }),

    endpoint({
      method: 'GET',
      path: '/reviews/:username',
      tag: 'reviews',
      summary: 'Get paginated reviews for a user.',
      query: reviewsQuery,
      response: paginatedReviewResponse,
      async handler({ params, query, accountUuid }) {
        const page = await useCases.getReviews.execute(params.username!, accountUuid, {
          ...query,
          status: query.status ?? null,
        })
        return {
          items: page.items.map((item) => toReviewResponse(item, page)),
          has_more: page.hasMore,
        }
      },
    }),

    endpoint({
      method: 'DELETE',
      path: '/reviews/:username',
      tag: 'reviews',
      summary: 'Delete your review of a user.',
      async handler({ params, accountUuid }) {
        await useCases.deleteReview.execute(accountUuid, params.username!)
      },
    }),

    endpoint({
      method: 'PATCH',
      path: '/reviews/:review_id/visibility',
      tag: 'reviews',
      summary: 'Toggle the hidden state of a review comment.',
      body: toggleCommentHiddenRequest,
      response: reviewResponse,
      async handler({ params, body, accountUuid }) {
        const toggled = await useCases.toggleCommentHidden.execute(
          params.review_id!,
          accountUuid,
          body.hidden,
        )
        return toReviewResponse(toggled.reviewWithUsername, toggled)
      },
    }),
  ]
}
