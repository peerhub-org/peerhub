import type { AccountService } from '../../../domain/accounts/services/account_service.ts'
import type { ReviewEnrichmentService } from '../../../domain/reviews/services/review_enrichment_service.ts'
import type {
  CreateOrUpdateReview,
  ReviewService,
} from '../../../domain/reviews/services/review_service.ts'
import type { ReviewWithUsername } from '../../../domain/reviews/value_objects/review_with_username.ts'
import type { WatchlistService } from '../../../domain/watchlist/services/watchlist_service.ts'
import type { EmailService } from '../../../infrastructure/email/email_service.ts'
import type { Logger } from '../../../infrastructure/shared/observability/logging.ts'

/** Submit a review, notifying abuse control and watching the reviewed user. */
export class CreateOrUpdateReviewUseCase {
  readonly #reviewService: ReviewService
  readonly #accountService: AccountService
  readonly #enrichmentService: ReviewEnrichmentService
  readonly #watchlistService: WatchlistService
  readonly #emailService: Pick<EmailService, 'sendNewReviewNotification'>
  readonly #logger: Logger

  constructor(
    reviewService: ReviewService,
    accountService: AccountService,
    enrichmentService: ReviewEnrichmentService,
    watchlistService: WatchlistService,
    emailService: Pick<EmailService, 'sendNewReviewNotification'>,
    logger: Logger,
  ) {
    this.#reviewService = reviewService
    this.#accountService = accountService
    this.#enrichmentService = enrichmentService
    this.#watchlistService = watchlistService
    this.#emailService = emailService
    this.#logger = logger
  }

  async execute(input: CreateOrUpdateReview): Promise<ReviewWithUsername> {
    // Before storing anything: reviews by inactive accounts are not shown anywhere.
    await this.#accountService.getActiveAccountByUuid(input.reviewerUuid)
    const { review, isNew } = await this.#reviewService.createOrUpdateReview(input)

    if (isNew) await this.#notify(input)
    await this.#watch(input)

    const [enriched] = await this.#enrichmentService.enrichReviews([review])
    // Only if the account was deleted in the meantime
    if (!enriched) throw new Error('Reviewer has no active account')
    return enriched
  }

  async #notify(input: CreateOrUpdateReview): Promise<void> {
    try {
      const reviewer = await this.#accountService.getAccountByUuid(input.reviewerUuid)
      await this.#emailService.sendNewReviewNotification({
        reviewerUsername: reviewer.username,
        reviewedUsername: input.reviewedUsername,
        status: input.status,
        comment: input.comment,
        anonymous: input.anonymous,
      })
    } catch (error) {
      this.#logger.error({ error }, 'Failed to send new review notification email')
    }
  }

  async #watch(input: CreateOrUpdateReview): Promise<void> {
    try {
      await this.#watchlistService.watch(input.reviewerUuid, input.reviewedUsername)
    } catch (error) {
      this.#logger.error({ error }, 'Failed to auto-watch user after review submission')
    }
  }
}
