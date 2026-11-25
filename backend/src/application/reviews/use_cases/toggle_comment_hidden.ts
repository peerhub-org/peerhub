import type { AccountService } from '../../../domain/accounts/services/account_service.ts'
import type { Review } from '../../../domain/reviews/entities/review.ts'
import type { ReviewEnrichmentService } from '../../../domain/reviews/services/review_enrichment_service.ts'
import type { ReviewService } from '../../../domain/reviews/services/review_service.ts'
import type { ReviewWithUsername } from '../../../domain/reviews/value_objects/review_with_username.ts'
import {
  ReviewNotFoundException,
  UnauthorizedActionException,
} from '../../../domain/shared/exceptions.ts'
import type { Uuid } from '../../../domain/shared/uuid.ts'

/** The changed review, with what the caller may see in it. */
export interface ToggledReview {
  reviewWithUsername: ReviewWithUsername
  isPageOwner: boolean
  isModerator: boolean
}

/**
 * Hide or show a review comment.
 *
 * Page owner and moderators can hide comments. Each actor can only show again what they
 * hid themselves, except that moderators can also undo what other moderators hid.
 */
export class ToggleCommentHiddenUseCase {
  readonly #reviewService: ReviewService
  readonly #accountService: AccountService
  readonly #enrichmentService: ReviewEnrichmentService
  readonly #moderators: ReadonlySet<string>

  constructor(
    reviewService: ReviewService,
    accountService: AccountService,
    enrichmentService: ReviewEnrichmentService,
    moderators: ReadonlySet<string>,
  ) {
    this.#reviewService = reviewService
    this.#accountService = accountService
    this.#enrichmentService = enrichmentService
    this.#moderators = moderators
  }

  async execute(
    reviewId: string,
    currentAccountUuid: Uuid,
    hidden: boolean,
  ): Promise<ToggledReview> {
    const review = await this.#reviewService.getReviewById(reviewId)
    if (review === null) throw new ReviewNotFoundException(reviewId)

    const { username } = await this.#accountService.getAccountByUuid(currentAccountUuid)
    // Task 53: case-sensitive, as in the Python backend.
    const isPageOwner = username === review.reviewedUsername
    const isModerator = this.#moderators.has(username)
    if (!isPageOwner && !isModerator)
      throw new UnauthorizedActionException(
        'Only the page owner or moderators can hide/unhide comments',
      )
    if (!hidden && !canShow(review, username, isModerator))
      throw new UnauthorizedActionException('You can only unhide comments that you hid')

    review.setCommentHidden(hidden, hidden ? username : null)
    const updated = await this.#reviewService.updateReview(review)
    const [reviewWithUsername] = await this.#enrichmentService.enrichReviews([updated])
    // Task 50: happens after the change is stored, when the reviewer was deleted.
    if (!reviewWithUsername) throw new Error('Reviewer has no active account')

    return { reviewWithUsername, isPageOwner, isModerator }
  }
}

function canShow(review: Review, username: string, isModerator: boolean): boolean {
  if (review.commentHiddenBy === username) return true
  return isModerator && review.commentHiddenBy !== review.reviewedUsername
}
