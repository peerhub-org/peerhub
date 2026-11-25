import type { Binary, ObjectId } from 'mongodb'

export const WATCHLIST = 'watchlist'

export interface WatchDocument {
  _id: ObjectId
  watcher_uuid: Binary
  watched_username: string
  created_at: Date
}
