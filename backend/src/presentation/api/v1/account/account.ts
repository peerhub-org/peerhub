import { z } from 'zod'
import type { Container } from '../../container.ts'
import { endpoint, type Endpoint } from '../../endpoint.ts'
import { reviewResponse, toOwnReviewResponse } from '../review/schemas.ts'
import {
  accountResponse,
  activityFeedQuery,
  paginatedActivityFeedResponse,
  toAccountResponse,
  toActivityFeedItemResponse,
} from './schemas.ts'

export function accountEndpoints({ settings, useCases }: Container): Endpoint[] {
  return [
    endpoint({
      method: 'GET',
      path: '/account',
      tag: 'account',
      summary: 'Get the current authenticated account.',
      response: accountResponse,
      async handler({ accountUuid }) {
        const account = await useCases.getCurrentAccount.execute(accountUuid)
        return toAccountResponse(account, settings.MODERATOR_USERNAMES)
      },
    }),

    endpoint({
      method: 'DELETE',
      path: '/account',
      tag: 'account',
      summary: 'Delete the current account.',
      response: accountResponse,
      async handler({ accountUuid }) {
        const account = await useCases.deleteAccount.execute(accountUuid)
        return toAccountResponse(account, settings.MODERATOR_USERNAMES)
      },
    }),

    endpoint({
      method: 'GET',
      path: '/account/reviews',
      tag: 'account',
      summary: 'Get all reviews made by the current authenticated user.',
      response: z.array(reviewResponse),
      async handler({ accountUuid }) {
        const reviews = await useCases.getMyReviews.execute(accountUuid)
        return reviews.map(toOwnReviewResponse)
      },
    }),

    endpoint({
      method: 'GET',
      path: '/account/feed',
      tag: 'account',
      summary: 'Get activity feed with reviews.',
      query: activityFeedQuery,
      response: paginatedActivityFeedResponse,
      async handler({ query: { filter, limit, offset }, accountUuid }) {
        // One more than asked tells whether there is a next page.
        const items = await useCases.getActivityFeed.execute(accountUuid, filter, limit + 1, offset)
        return {
          items: items.slice(0, limit).map(toActivityFeedItemResponse),
          has_more: items.length > limit,
        }
      },
    }),
  ]
}
