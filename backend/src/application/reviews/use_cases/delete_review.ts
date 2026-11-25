import type { ReviewService } from '../../../domain/reviews/services/review_service.ts'
import type { Uuid } from '../../../domain/shared/uuid.ts'

export class DeleteReviewUseCase {
  readonly #reviewService: ReviewService

  constructor(reviewService: ReviewService) {
    this.#reviewService = reviewService
  }

  async execute(reviewerUuid: Uuid, reviewedUsername: string): Promise<void> {
    await this.#reviewService.deleteReview(reviewerUuid, reviewedUsername)
  }
}
