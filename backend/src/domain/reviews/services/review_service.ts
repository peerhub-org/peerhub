import type { IAccountRepository } from '../../accounts/repositories/account_repository.ts'
import { MAX_COMMENT_LENGTH } from '../../shared/constants.ts'
import {
  AnonymousFieldImmutableException,
  ReviewValidationException,
  SelfReviewException,
} from '../../shared/exceptions.ts'
import { checkNotSelfAction, checkTargetIsUserType } from '../../shared/services/validators.ts'
import type { Uuid } from '../../shared/uuid.ts'
import type { IUserRepository } from '../../users/repositories/user_repository.ts'
import { Review, ReviewStatus } from '../entities/review.ts'
import type { IReviewRepository } from '../repositories/review_repository.ts'
import { sanitizeComment } from './comment_sanitizer.ts'

export interface CreateOrUpdateReview {
  reviewerUuid: Uuid
  reviewedUsername: string
  status: ReviewStatus
  comment: string | null
  anonymous: boolean
}

export class ReviewService {
  readonly #reviews: IReviewRepository
  readonly #accounts: IAccountRepository
  readonly #users: IUserRepository

  constructor(
    reviewRepository: IReviewRepository,
    accountRepository: IAccountRepository,
    userRepository: IUserRepository,
  ) {
    this.#reviews = reviewRepository
    this.#accounts = accountRepository
    this.#users = userRepository
  }

  /** Create a review, or update the one this reviewer already wrote about the user. */
  async createOrUpdateReview(
    input: CreateOrUpdateReview,
  ): Promise<{ review: Review; isNew: boolean }> {
    const { reviewerUuid, reviewedUsername, status, anonymous } = input
    const comment = sanitizeComment(input.comment)

    this.#validateComment(status, comment)
    await checkNotSelfAction(this.#accounts, reviewerUuid, reviewedUsername, SelfReviewException)
    await checkTargetIsUserType(this.#users, reviewedUsername)

    const existing = await this.#reviews.getByReviewerAndUsername(reviewerUuid, reviewedUsername)
    if (existing) {
      if (existing.anonymous !== anonymous) throw new AnonymousFieldImmutableException()
      existing.updateStatus(status, comment)
      return { review: await this.#reviews.update(existing), isNew: false }
    }

    const now = new Date()
    const review = new Review({
      id: null,
      reviewerUuid,
      reviewedUsername,
      status,
      comment,
      anonymous,
      createdAt: now,
      updatedAt: now,
    })
    return { review: await this.#reviews.create(review), isNew: true }
  }

  async getReviewsForUser(
    reviewedUsername: string,
    limit = 100,
    offset = 0,
    status: string | null = null,
  ): Promise<Review[]> {
    return this.#reviews.getAllForUsername(reviewedUsername, limit, offset, status)
  }

  async getReviewsByReviewer(reviewerUuid: Uuid, limit = 100, offset = 0): Promise<Review[]> {
    return this.#reviews.getAllByReviewerUuid(reviewerUuid, limit, offset)
  }

  async getReviewCountsForUsernames(usernames: string[]): Promise<Map<string, number>> {
    return this.#reviews.getReviewCountsForUsernames(usernames)
  }

  async deleteReview(reviewerUuid: Uuid, reviewedUsername: string): Promise<void> {
    const review = await this.#reviews.getByReviewerAndUsername(reviewerUuid, reviewedUsername)
    if (review?.id) await this.#reviews.delete(review.id)
  }

  /** Returns how many reviews were deleted. */
  async deleteReviewsByReviewer(reviewerUuid: Uuid): Promise<number> {
    return this.#reviews.deleteAllByReviewerUuid(reviewerUuid)
  }

  async getReviewById(reviewId: string): Promise<Review | null> {
    return this.#reviews.getById(reviewId)
  }

  async updateReview(review: Review): Promise<Review> {
    return this.#reviews.update(review)
  }

  #validateComment(status: ReviewStatus, comment: string | null): void {
    if (comment !== null && [...comment].length > MAX_COMMENT_LENGTH)
      throw new ReviewValidationException('Comment exceeds maximum length')
    // Sanitizing already turned blank comments into null.
    if (status === ReviewStatus.COMMENT && comment === null)
      throw new ReviewValidationException("Comment is required for 'comment' status")
  }
}
