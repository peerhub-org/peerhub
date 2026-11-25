import type { Watch } from '../../../../domain/watchlist/entities/watch.ts'
import {
  uuidFromBson,
  uuidToBson,
  type Mapper,
} from '../../../shared/database/mappers/base_mapper.ts'
import type { WatchDocument } from '../models/watch_model.ts'

export const watchMapper: Mapper<Watch, WatchDocument> = {
  toEntity: (document) => ({
    id: document._id.toHexString(),
    watcherUuid: uuidFromBson(document.watcher_uuid),
    watchedUsername: document.watched_username,
    createdAt: document.created_at,
  }),

  toFields: (entity) => ({
    watcher_uuid: uuidToBson(entity.watcherUuid),
    watched_username: entity.watchedUsername,
    created_at: entity.createdAt,
  }),
}
