import type { AccountService } from '../../../domain/accounts/services/account_service.ts'
import type { Review } from '../../../domain/reviews/entities/review.ts'
import type { ReviewEnrichmentService } from '../../../domain/reviews/services/review_enrichment_service.ts'
import type { ReviewService } from '../../../domain/reviews/services/review_service.ts'
import type { ReviewWithUsername } from '../../../domain/reviews/value_objects/review_with_username.ts'
import {
  ReviewNotFoundException,
  UnauthorizedActionException,
} from '../../../domain/shared/exceptions.ts'
import { sameUsername } from '../../../domain/shared/usernames.ts'
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
 * hid themselves, except that moderators can also undo what other moderators hid. Page
 * owners cannot hide again what a moderator hid.
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
    // Reviews by deleted accounts are not shown anywhere, so they cannot be changed either.
    const [enriched] = await this.#enrichmentService.enrichReviews(review === null ? [] : [review])
    if (review === null || !enriched) throw new ReviewNotFoundException(reviewId)

    const { username } = await this.#accountService.getAccountByUuid(currentAccountUuid)
    const isPageOwner = sameUsername(username, review.reviewedUsername)
    const isModerator = this.#moderators.has(username)
    if (!isPageOwner && !isModerator)
      throw new UnauthorizedActionException(
        'Only the page owner or moderators can hide/unhide comments',
      )
    const mayShow = canShow(review, username, isModerator)
    if (!hidden && !mayShow)
      throw new UnauthorizedActionException('You can only unhide comments that you hid')
    // Hiding again makes the comment theirs to show, which would undo the moderation.
    if (hidden && review.commentHidden && !mayShow && !isModerator)
      throw new UnauthorizedActionException('This comment was already hidden by a moderator')

    review.setCommentHidden(hidden, hidden ? username : null)
    const updated = await this.#reviewService.updateReview(review)
    return { reviewWithUsername: { ...enriched, review: updated }, isPageOwner, isModerator }
  }
}

function canShow(review: Review, username: string, isModerator: boolean): boolean {
  if (review.commentHiddenBy === null) return isModerator
  if (sameUsername(review.commentHiddenBy, username)) return true
  return isModerator && !sameUsername(review.commentHiddenBy, review.reviewedUsername)
}
