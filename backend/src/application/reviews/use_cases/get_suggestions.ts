import type { AccountService } from '../../../domain/accounts/services/account_service.ts'
import type { ReviewService } from '../../../domain/reviews/services/review_service.ts'
import { AccessTokenMissingException } from '../../../domain/shared/exceptions.ts'
import type { Uuid } from '../../../domain/shared/uuid.ts'
import type { WatchlistService } from '../../../domain/watchlist/services/watchlist_service.ts'
import type { GitHubClient } from '../../../infrastructure/github/external/github_client.ts'

export interface ReviewSuggestion {
  username: string
  avatarUrl: string | null
}

interface ScoredSuggestion extends ReviewSuggestion {
  hasOpenAccount: boolean
  reviewCount: number
}

const MAX_KNOWN = 500

/** Suggest users to review among those the current user follows on GitHub. */
export class GetSuggestionsUseCase {
  readonly #accountService: AccountService
  readonly #watchlistService: WatchlistService
  readonly #reviewService: ReviewService
  readonly #github: Pick<GitHubClient, 'fetchFollowingSample'>

  constructor(
    accountService: AccountService,
    watchlistService: WatchlistService,
    reviewService: ReviewService,
    github: Pick<GitHubClient, 'fetchFollowingSample'>,
  ) {
    this.#accountService = accountService
    this.#watchlistService = watchlistService
    this.#reviewService = reviewService
    this.#github = github
  }

  async execute(accountUuid: Uuid, limit: number): Promise<ReviewSuggestion[]> {
    const account = await this.#accountService.getAccountByUuid(accountUuid)
    if (!account.accessToken) throw new AccessTokenMissingException()

    const [following, watchlist, reviews] = await Promise.all([
      this.#github.fetchFollowingSample(account.username, account.accessToken),
      this.#watchlistService.getWatchlist(accountUuid, MAX_KNOWN),
      this.#reviewService.getReviewsByReviewer(accountUuid, MAX_KNOWN),
    ])

    const known = new Set(
      [
        account.username,
        ...watchlist.map((watch) => watch.watchedUsername),
        ...reviews.map((review) => review.reviewedUsername),
      ].map((username) => username.toLowerCase()),
    )
    const candidates = new Map<string, ReviewSuggestion>()
    for (const { login, avatarUrl, type } of following)
      if (login && type === 'User' && !known.has(login.toLowerCase()))
        candidates.set(login.toLowerCase(), { username: login, avatarUrl })
    if (candidates.size === 0) return []

    const usernames = [...candidates.keys()]
    const [accounts, reviewCounts] = await Promise.all([
      this.#accountService.getAccountsByUsernames(usernames),
      this.#reviewService.getReviewCountsForUsernames(usernames),
    ])

    const suggestions: ScoredSuggestion[] = []
    for (const [key, candidate] of candidates) {
      const existing = accounts.get(key)
      if (existing && existing.deletedAt !== null) continue
      suggestions.push({
        ...candidate,
        hasOpenAccount: existing !== undefined,
        // Task 52: counts are keyed by the stored spelling, not by lowercase.
        reviewCount: reviewCounts.get(key) ?? 0,
      })
    }
    return prioritize(suggestions)
      .slice(0, limit)
      .map(({ username, avatarUrl }) => ({ username, avatarUrl }))
  }
}

/** Open accounts first, then the most reviewed, then everybody else in random order. */
function prioritize(suggestions: ScoredSuggestion[]): ScoredSuggestion[] {
  const isKnown = (s: ScoredSuggestion) => s.hasOpenAccount || s.reviewCount > 0
  const prioritized = suggestions.filter(isKnown).sort((a, b) => {
    if (a.hasOpenAccount !== b.hasOpenAccount) return a.hasOpenAccount ? -1 : 1
    if (a.reviewCount !== b.reviewCount) return b.reviewCount - a.reviewCount
    return a.username.toLowerCase() < b.username.toLowerCase() ? -1 : 1
  })
  return [...prioritized, ...shuffle(suggestions.filter((s) => !isKnown(s)))]
}

function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  return shuffled
}
