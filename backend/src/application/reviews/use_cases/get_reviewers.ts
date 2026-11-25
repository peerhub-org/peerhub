import type { AccountService } from '../../../domain/accounts/services/account_service.ts'
import type { ReviewEnrichmentService } from '../../../domain/reviews/services/review_enrichment_service.ts'
import type { ReviewService } from '../../../domain/reviews/services/review_service.ts'
import type { ReviewWithUsername } from '../../../domain/reviews/value_objects/review_with_username.ts'
import { MAX_REVIEWERS } from '../../../domain/shared/constants.ts'
import type { Uuid } from '../../../domain/shared/uuid.ts'
import type { UserService } from '../../../domain/users/services/user_service.ts'
import type { FeatureFlagService } from '../../../infrastructure/shared/observability/feature_flags.ts'

/** Get everybody who reviewed a user, without pagination. */
export class GetReviewersUseCase {
  readonly #reviewService: ReviewService
  readonly #accountService: AccountService
  readonly #userService: UserService
  readonly #enrichmentService: ReviewEnrichmentService
  readonly #featureFlags: Pick<FeatureFlagService, 'getFeatureFlags'>

  constructor(
    reviewService: ReviewService,
    accountService: AccountService,
    userService: UserService,
    enrichmentService: ReviewEnrichmentService,
    featureFlags: Pick<FeatureFlagService, 'getFeatureFlags'>,
  ) {
    this.#reviewService = reviewService
    this.#accountService = accountService
    this.#userService = userService
    this.#enrichmentService = enrichmentService
    this.#featureFlags = featureFlags
  }

  async execute(reviewedUsername: string, viewerUuid: Uuid): Promise<ReviewWithUsername[]> {
    const target = await this.#accountService.getAccountByUsername(reviewedUsername)
    if (target !== null) {
      const user = await this.#userService.getUserByUsername(target.username)
      if (user === null) return []
    }

    let reviews = await this.#reviewService.getReviewsForUser(reviewedUsername, MAX_REVIEWERS)
    if (target === null && !(await this.#featureFlags.getFeatureFlags()).openDraftProfiles)
      reviews = reviews.filter((review) => review.reviewerUuid === viewerUuid)

    return this.#enrichmentService.enrichReviews(reviews)
  }
}
