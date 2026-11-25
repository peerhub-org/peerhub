import type { AccountService } from '../../../domain/accounts/services/account_service.ts'
import type { Review } from '../../../domain/reviews/entities/review.ts'
import type { ReviewService } from '../../../domain/reviews/services/review_service.ts'
import type { Uuid } from '../../../domain/shared/uuid.ts'
import type { UserService } from '../../../domain/users/services/user_service.ts'
import type { WatchlistService } from '../../../domain/watchlist/services/watchlist_service.ts'
import type { FeatureFlagService } from '../../../infrastructure/shared/observability/feature_flags.ts'

export interface ActivityFeedItem {
  review: Review
  /** Null when the review is anonymous. */
  reviewerUsername: string | null
  reviewerAvatarUrl: string | null
  reviewedUserAvatarUrl: string | null
}

/**
 * - "mine": reviews the current user received
 * - "watching": reviews received by the users they watch
 * - "all": both
 */
export type ActivityFeedFilter = 'all' | 'mine' | 'watching'

export class GetActivityFeedUseCase {
  readonly #watchlistService: WatchlistService
  readonly #reviewService: ReviewService
  readonly #accountService: AccountService
  readonly #userService: UserService
  readonly #featureFlags: Pick<FeatureFlagService, 'getFeatureFlags'>

  constructor(
    watchlistService: WatchlistService,
    reviewService: ReviewService,
    accountService: AccountService,
    userService: UserService,
    featureFlags: Pick<FeatureFlagService, 'getFeatureFlags'>,
  ) {
    this.#watchlistService = watchlistService
    this.#reviewService = reviewService
    this.#accountService = accountService
    this.#userService = userService
    this.#featureFlags = featureFlags
  }

  async execute(
    accountUuid: Uuid,
    filter: ActivityFeedFilter,
    limit: number,
    offset: number,
  ): Promise<ActivityFeedItem[]> {
    const account = await this.#accountService.getAccountByUuid(accountUuid)
    const reviews = await this.#fetchReviews(accountUuid, account.username, filter)
    const page = reviews
      .toSorted((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(offset, offset + limit)
    return this.#enrichReviews(page)
  }

  async #fetchReviews(
    accountUuid: Uuid,
    username: string,
    filter: ActivityFeedFilter,
  ): Promise<Review[]> {
    const usernames: string[] = []
    if (filter !== 'watching') usernames.push(username)
    if (filter !== 'mine') {
      const watchlist = await this.#watchlistService.getWatchlist(accountUuid)
      usernames.push(...watchlist.map((watch) => watch.watchedUsername))
    }

    const lists = await Promise.all(
      usernames.map((name) => this.#reviewService.getReviewsForUser(name)),
    )
    return this.#visibleReviews(lists.flat(), accountUuid)
  }

  /** Leave out deleted profiles and, when drafts are closed, what others wrote about them. */
  async #visibleReviews(reviews: Review[], viewerUuid: Uuid): Promise<Review[]> {
    const reviewedUsernames = [...new Set(reviews.map((review) => review.reviewedUsername))]
    const accounts = await this.#accountService.getAccountsByUsernames(reviewedUsernames)
    const accountOf = (review: Review) => accounts.get(review.reviewedUsername.toLowerCase())

    const hasDrafts = reviews.some((review) => !accountOf(review))
    const openDraftProfiles =
      !hasDrafts || (await this.#featureFlags.getFeatureFlags()).openDraftProfiles

    return reviews.filter((review) => {
      const account = accountOf(review)
      if (account) return account.deletedAt === null
      return openDraftProfiles || review.reviewerUuid === viewerUuid
    })
  }

  /** Reviews whose reviewer is unknown or deleted are left out. */
  async #enrichReviews(reviews: Review[]): Promise<ActivityFeedItem[]> {
    if (reviews.length === 0) return []

    const reviewerUuids = [...new Set(reviews.map((review) => review.reviewerUuid))]
    const reviewers = await this.#accountService.getAccountsByUuids(reviewerUuids)

    const usernames = new Map(
      [
        ...reviews.map((review) => review.reviewedUsername),
        ...[...reviewers.values()].map((account) => account.username),
      ].map((username) => [username.toLowerCase(), username]),
    )
    const users = await this.#userService.getUsersByUsernames([...usernames.values()])
    const avatarOf = (username: string) => users.get(username.toLowerCase())?.avatarUrl ?? null

    return reviews.flatMap((review) => {
      const reviewer = reviewers.get(review.reviewerUuid)
      if (!reviewer || reviewer.deletedAt !== null) return []
      return {
        review,
        reviewerUsername: review.anonymous ? null : reviewer.username,
        reviewerAvatarUrl: review.anonymous ? null : avatarOf(reviewer.username),
        reviewedUserAvatarUrl: avatarOf(review.reviewedUsername),
      }
    })
  }
}
