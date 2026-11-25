import type { IAccountRepository } from '../../accounts/repositories/account_repository.ts'
import { DuplicateEntityError, SelfWatchException } from '../../shared/exceptions.ts'
import { checkNotSelfAction, checkTargetIsUserType } from '../../shared/services/validators.ts'
import type { Uuid } from '../../shared/uuid.ts'
import type { IUserRepository } from '../../users/repositories/user_repository.ts'
import type { Watch } from '../entities/watch.ts'
import type { IWatchlistRepository } from '../repositories/watchlist_repository.ts'

export class WatchlistService {
  readonly #watchlist: IWatchlistRepository
  readonly #accounts: IAccountRepository
  readonly #users: IUserRepository

  constructor(
    watchlistRepository: IWatchlistRepository,
    accountRepository: IAccountRepository,
    userRepository: IUserRepository,
  ) {
    this.#watchlist = watchlistRepository
    this.#accounts = accountRepository
    this.#users = userRepository
  }

  /** Watch a user. Returns the existing watch if already watching. */
  async watch(watcherUuid: Uuid, watchedUsername: string): Promise<Watch> {
    await checkNotSelfAction(this.#accounts, watcherUuid, watchedUsername, SelfWatchException)
    await checkTargetIsUserType(this.#users, watchedUsername)

    const existing = await this.#watchlist.getByWatcherAndUsername(watcherUuid, watchedUsername)
    if (existing) return existing

    try {
      return await this.#watchlist.create({
        id: null,
        watcherUuid,
        watchedUsername,
        createdAt: new Date(),
      })
    } catch (error) {
      // Created in the meantime by another request
      const created =
        error instanceof DuplicateEntityError &&
        (await this.#watchlist.getByWatcherAndUsername(watcherUuid, watchedUsername))
      if (!created) throw error
      return created
    }
  }

  async unwatch(watcherUuid: Uuid, watchedUsername: string): Promise<void> {
    await this.#watchlist.delete(watcherUuid, watchedUsername)
  }

  async getWatchlist(watcherUuid: Uuid, limit = 100, offset = 0): Promise<Watch[]> {
    return this.#watchlist.getAllByWatcher(watcherUuid, limit, offset)
  }

  async isWatching(watcherUuid: Uuid, watchedUsername: string): Promise<boolean> {
    const watch = await this.#watchlist.getByWatcherAndUsername(watcherUuid, watchedUsername)
    return watch !== null
  }

  /** Returns how many watches were deleted. */
  async deleteAllByWatcher(watcherUuid: Uuid): Promise<number> {
    return this.#watchlist.deleteAllByWatcher(watcherUuid)
  }
}
