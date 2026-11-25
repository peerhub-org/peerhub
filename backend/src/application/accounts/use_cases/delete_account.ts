import type { Account } from '../../../domain/accounts/entities/account.ts'
import type { AccountService } from '../../../domain/accounts/services/account_service.ts'
import type { ReviewService } from '../../../domain/reviews/services/review_service.ts'
import type { Uuid } from '../../../domain/shared/uuid.ts'
import type { WatchlistService } from '../../../domain/watchlist/services/watchlist_service.ts'

/** Delete an account together with the reviews it wrote and its watchlist. */
export class DeleteAccountUseCase {
  readonly #accountService: AccountService
  readonly #reviewService: ReviewService
  readonly #watchlistService: WatchlistService

  constructor(
    accountService: AccountService,
    reviewService: ReviewService,
    watchlistService: WatchlistService,
  ) {
    this.#accountService = accountService
    this.#reviewService = reviewService
    this.#watchlistService = watchlistService
  }

  async execute(accountUuid: Uuid): Promise<Account> {
    const account = await this.#accountService.getAccountByUuid(accountUuid)
    await this.#reviewService.deleteReviewsByReviewer(accountUuid)
    await this.#watchlistService.deleteAllByWatcher(accountUuid)
    return this.#accountService.deleteAccount(account)
  }
}
