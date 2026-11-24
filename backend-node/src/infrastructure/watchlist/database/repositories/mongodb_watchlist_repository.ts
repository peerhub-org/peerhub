import type { Db } from 'mongodb'
import type { Uuid } from '../../../../domain/shared/uuid.ts'
import type { Watch } from '../../../../domain/watchlist/entities/watch.ts'
import type { IWatchlistRepository } from '../../../../domain/watchlist/repositories/watchlist_repository.ts'
import { CASE_INSENSITIVE } from '../../../shared/database/constants.ts'
import { uuidToBson } from '../../../shared/database/mappers/base_mapper.ts'
import { BaseRepository } from '../../../shared/database/repositories/base_repository.ts'
import { watchMapper } from '../mappers/watch_mapper.ts'
import { WATCHLIST, type WatchDocument } from '../models/watch_model.ts'

export class MongoDBWatchlistRepository
  extends BaseRepository<Watch, WatchDocument>
  implements IWatchlistRepository
{
  constructor(db: Db) {
    super(db.collection<WatchDocument>(WATCHLIST), watchMapper)
  }

  async getByWatcherAndUsername(watcherUuid: Uuid, watchedUsername: string): Promise<Watch | null> {
    const document = await this.collection.findOne(
      { watcher_uuid: uuidToBson(watcherUuid), watched_username: watchedUsername },
      { collation: CASE_INSENSITIVE },
    )
    return document && watchMapper.toEntity(document)
  }

  async getAllByWatcher(watcherUuid: Uuid, limit: number, offset: number): Promise<Watch[]> {
    const documents = await this.collection
      .find({ watcher_uuid: uuidToBson(watcherUuid) })
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray()
    return documents.map((document) => watchMapper.toEntity(document))
  }

  async delete(watcherUuid: Uuid, watchedUsername: string): Promise<void> {
    await this.collection.deleteOne(
      { watcher_uuid: uuidToBson(watcherUuid), watched_username: watchedUsername },
      { collation: CASE_INSENSITIVE },
    )
  }

  async deleteAllByWatcher(watcherUuid: Uuid): Promise<number> {
    const result = await this.collection.deleteMany({ watcher_uuid: uuidToBson(watcherUuid) })
    return result.deletedCount
  }
}
