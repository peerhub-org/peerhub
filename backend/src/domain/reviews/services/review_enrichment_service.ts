import type { AccountService } from '../../accounts/services/account_service.ts'
import type { UserService } from '../../users/services/user_service.ts'
import type { Review } from '../entities/review.ts'
import type { ReviewWithUsername } from '../value_objects/review_with_username.ts'

/** Resolves reviewer identity (account + GitHub profile) for reviews. */
export class ReviewEnrichmentService {
  readonly #accountService: AccountService
  readonly #userService: UserService

  constructor(accountService: AccountService, userService: UserService) {
    this.#accountService = accountService
    this.#userService = userService
  }

  /** Reviews whose reviewer is unknown or deleted are left out. */
  async enrichReviews(reviews: Review[]): Promise<ReviewWithUsername[]> {
    if (reviews.length === 0) return []

    const reviewerUuids = [...new Set(reviews.map((review) => review.reviewerUuid))]
    const accounts = await this.#accountService.getAccountsByUuids(reviewerUuids)
    const active = new Map([...accounts].filter(([, account]) => account.deletedAt === null))

    const usernames = [...new Set([...active.values()].map((account) => account.username))]
    const users = await this.#userService.getUsersByUsernames(usernames)

    return reviews.flatMap((review) => {
      const account = active.get(review.reviewerUuid)
      if (!account) return []
      const user = users.get(account.username.toLowerCase())
      return {
        review,
        reviewerUsername: account.username,
        reviewerAvatarUrl: user?.avatarUrl ?? null,
      }
    })
  }
}
