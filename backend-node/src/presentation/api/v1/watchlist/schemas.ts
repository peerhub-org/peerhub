import { z } from 'zod'
import type { WatchWithUser } from '../../../../application/watchlist/use_cases/get_watchlist.ts'
import { queryInt } from '../../validation.ts'
import { dateTime, storedId, toDateTime } from '../shared/schemas.ts'

export const watchRequest = z.object({ username: z.string() }).meta({ id: 'WatchRequest' })

export const watchCreatedResponse = z.record(z.string(), z.string())

export const watchlistQuery = z.object({
  limit: queryInt({ default: 100, min: 1, max: 500 }),
  offset: queryInt({ default: 0, min: 0 }),
})

export const watchResponse = z
  .object({
    id: z.string(),
    watched_username: z.string(),
    watched_avatar_url: z.string().nullable(),
    watched_name: z.string().nullable(),
    created_at: dateTime,
  })
  .meta({ id: 'WatchResponse' })

export function toWatchResponse({ watch, user }: WatchWithUser): z.output<typeof watchResponse> {
  return {
    id: storedId(watch),
    watched_username: watch.watchedUsername,
    watched_avatar_url: user?.avatarUrl ?? null,
    watched_name: user?.name ?? null,
    created_at: toDateTime(watch.createdAt),
  }
}

export const watchStatusResponse = z
  .object({ is_watching: z.boolean() })
  .meta({ id: 'WatchStatusResponse' })
