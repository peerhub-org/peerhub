import type { Uuid } from '../../../domain/shared/uuid.ts'
import type { Watch } from '../../../domain/watchlist/entities/watch.ts'
import type { WatchlistService } from '../../../domain/watchlist/services/watchlist_service.ts'

export class WatchUseCase {
  readonly #watchlistService: WatchlistService

  constructor(watchlistService: WatchlistService) {
    this.#watchlistService = watchlistService
  }

  async execute(watcherUuid: Uuid, watchedUsername: string): Promise<Watch> {
    return this.#watchlistService.watch(watcherUuid, watchedUsername)
  }
}
