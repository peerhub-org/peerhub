import type { AccountService } from '../../../domain/accounts/services/account_service.ts'
import type { ReviewEnrichmentService } from '../../../domain/reviews/services/review_enrichment_service.ts'
import type { ReviewService } from '../../../domain/reviews/services/review_service.ts'
import type { ReviewWithUsername } from '../../../domain/reviews/value_objects/review_with_username.ts'
import type { Uuid } from '../../../domain/shared/uuid.ts'
import type { FeatureFlagService } from '../../../infrastructure/shared/observability/feature_flags.ts'

/** Page of reviews, with what the viewer may see in it. */
export interface PaginatedReviews {
  items: ReviewWithUsername[]
  hasMore: boolean
  isPageOwner: boolean
  isModerator: boolean
}

export interface ReviewPage {
  limit: number
  offset: number
  status: string | null
}

export class GetReviewsUseCase {
  readonly #reviewService: ReviewService
  readonly #accountService: AccountService
  readonly #enrichmentService: ReviewEnrichmentService
  readonly #featureFlags: Pick<FeatureFlagService, 'getFeatureFlags'>
  readonly #moderators: ReadonlySet<string>

  constructor(
    reviewService: ReviewService,
    accountService: AccountService,
    enrichmentService: ReviewEnrichmentService,
    featureFlags: Pick<FeatureFlagService, 'getFeatureFlags'>,
    moderators: ReadonlySet<string>,
  ) {
    this.#reviewService = reviewService
    this.#accountService = accountService
    this.#enrichmentService = enrichmentService
    this.#featureFlags = featureFlags
    this.#moderators = moderators
  }

  async execute(
    reviewedUsername: string,
    viewerUuid: Uuid,
    { limit, offset, status }: ReviewPage,
  ): Promise<PaginatedReviews> {
    const viewer = await this.#accountService.getAccountByUuid(viewerUuid)
    const target = await this.#accountService.getAccountByUsername(reviewedUsername)
    const onlyOwnReviews =
      target === null && !(await this.#featureFlags.getFeatureFlags()).openDraftProfiles

    let reviews
    if (onlyOwnReviews) {
      const all = await this.#reviewService.getReviewsForUser(reviewedUsername, 0, 0, status)
      reviews = all.filter((review) => review.reviewerUuid === viewerUuid).slice(offset)
    } else {
      // One more than asked tells whether there is a next page.
      reviews = await this.#reviewService.getReviewsForUser(
        reviewedUsername,
        limit + 1,
        offset,
        status,
      )
    }

    return {
      items: await this.#enrichmentService.enrichReviews(reviews.slice(0, limit)),
      hasMore: reviews.length > limit,
      isPageOwner: viewer.username.toLowerCase() === reviewedUsername.toLowerCase(),
      isModerator: this.#moderators.has(viewer.username),
    }
  }
}
