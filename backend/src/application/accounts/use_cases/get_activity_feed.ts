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
    const usernames = await this.#usernames(accountUuid, account.username, filter)
    const accounts = await this.#accountService.getAccountsByUsernames(usernames)
    const accountOf = (username: string) => accounts.get(username.toLowerCase())

    // Deleted profiles are left out and, when drafts are closed, what others wrote about them.
    const drafts = usernames.filter((username) => !accountOf(username))
    const openDraftProfiles =
      drafts.length === 0 || (await this.#featureFlags.getFeatureFlags()).openDraftProfiles
    const active = usernames.filter((username) => accountOf(username)?.deletedAt === null)

    const reviews = await this.#reviewService.getFeed(
      {
        usernames: openDraftProfiles ? [...active, ...drafts] : active,
        onlyByViewer: openDraftProfiles ? [] : drafts,
        viewerUuid: accountUuid,
      },
      limit,
      offset,
    )
    return this.#enrichReviews(reviews)
  }

  async #usernames(
    accountUuid: Uuid,
    username: string,
    filter: ActivityFeedFilter,
  ): Promise<string[]> {
    const watchlist =
      filter === 'mine' ? [] : await this.#watchlistService.getWatchlist(accountUuid, 0)
    const watched = watchlist.map((watch) => watch.watchedUsername)
    return filter === 'watching' ? watched : [username, ...watched]
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
