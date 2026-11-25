import type { Uuid } from '../../../domain/shared/uuid.ts'
import type { User } from '../../../domain/users/entities/user.ts'
import type { UserService } from '../../../domain/users/services/user_service.ts'
import type { Watch } from '../../../domain/watchlist/entities/watch.ts'
import type { WatchlistService } from '../../../domain/watchlist/services/watchlist_service.ts'

/** Watch with the profile of the watched user, if known. */
export interface WatchWithUser {
  watch: Watch
  user: User | null
}

export class GetWatchlistUseCase {
  readonly #watchlistService: WatchlistService
  readonly #userService: UserService

  constructor(watchlistService: WatchlistService, userService: UserService) {
    this.#watchlistService = watchlistService
    this.#userService = userService
  }

  async execute(watcherUuid: Uuid, limit: number, offset: number): Promise<WatchWithUser[]> {
    const watchlist = await this.#watchlistService.getWatchlist(watcherUuid, limit, offset)
    return Promise.all(
      watchlist.map(async (watch) => ({
        watch,
        user: await this.#userService.getUserByUsername(watch.watchedUsername),
      })),
    )
  }
}
