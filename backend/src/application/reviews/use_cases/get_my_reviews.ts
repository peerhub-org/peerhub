import type { ReviewEnrichmentService } from '../../../domain/reviews/services/review_enrichment_service.ts'
import type { ReviewService } from '../../../domain/reviews/services/review_service.ts'
import type { ReviewWithUsername } from '../../../domain/reviews/value_objects/review_with_username.ts'
import type { Uuid } from '../../../domain/shared/uuid.ts'

/** Get the reviews the current user wrote, anonymous ones included. */
export class GetMyReviewsUseCase {
  readonly #reviewService: ReviewService
  readonly #enrichmentService: ReviewEnrichmentService

  constructor(reviewService: ReviewService, enrichmentService: ReviewEnrichmentService) {
    this.#reviewService = reviewService
    this.#enrichmentService = enrichmentService
  }

  async execute(reviewerUuid: Uuid): Promise<ReviewWithUsername[]> {
    const reviews = await this.#reviewService.getReviewsByReviewer(reviewerUuid)
    return this.#enrichmentService.enrichReviews(reviews)
  }
}
