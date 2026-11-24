import type { Uuid } from '../../../domain/shared/uuid.ts'
import type { WatchlistService } from '../../../domain/watchlist/services/watchlist_service.ts'

export class UnwatchUseCase {
  readonly #watchlistService: WatchlistService

  constructor(watchlistService: WatchlistService) {
    this.#watchlistService = watchlistService
  }

  async execute(watcherUuid: Uuid, watchedUsername: string): Promise<void> {
    await this.#watchlistService.unwatch(watcherUuid, watchedUsername)
  }
}
