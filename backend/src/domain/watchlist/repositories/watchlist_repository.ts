import type { Uuid } from '../../shared/uuid.ts'
import type { Watch } from '../entities/watch.ts'

/** Username lookups are case-insensitive; lists come newest first. */
export interface IWatchlistRepository {
  getByWatcherAndUsername(watcherUuid: Uuid, watchedUsername: string): Promise<Watch | null>
  /** A limit of 0 means no limit. */
  getAllByWatcher(watcherUuid: Uuid, limit: number, offset: number): Promise<Watch[]>
  /** Throws DuplicateEntityError when the user is already watched. */
  create(watch: Watch): Promise<Watch>
  delete(watcherUuid: Uuid, watchedUsername: string): Promise<void>
  /** Returns how many watches were deleted. */
  deleteAllByWatcher(watcherUuid: Uuid): Promise<number>
}
