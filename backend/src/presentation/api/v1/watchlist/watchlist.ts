import { z } from 'zod'
import type { Container } from '../../container.ts'
import { endpoint, type Endpoint } from '../../endpoint.ts'
import {
  toWatchResponse,
  watchCreatedResponse,
  watchlistQuery,
  watchRequest,
  watchResponse,
  watchStatusResponse,
} from './schemas.ts'

export function watchlistEndpoints({ useCases }: Container): Endpoint[] {
  return [
    endpoint({
      method: 'POST',
      path: '/watchlist',
      tag: 'watchlist',
      summary: 'Watch a user.',
      body: watchRequest,
      response: watchCreatedResponse,
      status: 201,
      async handler({ body, accountUuid }) {
        await useCases.watch.execute(accountUuid, body.username)
        return { message: 'Watched successfully' }
      },
    }),

    endpoint({
      method: 'GET',
      path: '/watchlist',
      tag: 'watchlist',
      summary: 'Get all watched users for current user.',
      query: watchlistQuery,
      response: z.array(watchResponse),
      async handler({ query, accountUuid }) {
        const watches = await useCases.getWatchlist.execute(accountUuid, query.limit, query.offset)
        return watches.map(toWatchResponse)
      },
    }),

    endpoint({
      method: 'GET',
      path: '/watchlist/check/:username',
      tag: 'watchlist',
      summary: 'Check if current user is watching a username.',
      response: watchStatusResponse,
      async handler({ params, accountUuid }) {
        return { is_watching: await useCases.checkWatch.execute(accountUuid, params.username!) }
      },
    }),

    endpoint({
      method: 'DELETE',
      path: '/watchlist/:username',
      tag: 'watchlist',
      summary: 'Unwatch a user.',
      async handler({ params, accountUuid }) {
        await useCases.unwatch.execute(accountUuid, params.username!)
      },
    }),
  ]
}
