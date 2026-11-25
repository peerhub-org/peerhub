import { randomUUID } from 'node:crypto'
import { vi } from 'vitest'
import { Account, type AccountProps } from '../../src/domain/accounts/entities/account.ts'
import type { IAccountRepository } from '../../src/domain/accounts/repositories/account_repository.ts'
import { AccountService } from '../../src/domain/accounts/services/account_service.ts'
import { Review, ReviewStatus, type ReviewProps } from '../../src/domain/reviews/entities/review.ts'
import type { IReviewRepository } from '../../src/domain/reviews/repositories/review_repository.ts'
import { ReviewEnrichmentService } from '../../src/domain/reviews/services/review_enrichment_service.ts'
import { ReviewService } from '../../src/domain/reviews/services/review_service.ts'
import type { IUserRepository } from '../../src/domain/users/repositories/user_repository.ts'
import { UserService } from '../../src/domain/users/services/user_service.ts'
import type { Watch } from '../../src/domain/watchlist/entities/watch.ts'
import type { IWatchlistRepository } from '../../src/domain/watchlist/repositories/watchlist_repository.ts'
import { WatchlistService } from '../../src/domain/watchlist/services/watchlist_service.ts'

/**
 * Real domain services over mocked repositories. By default nothing is found, and writes
 * return what they receive.
 */
export function createDomain() {
  const accounts = {
    getByUsername: vi.fn<IAccountRepository['getByUsername']>(async () => null),
    getByUuid: vi.fn<IAccountRepository['getByUuid']>(async () => null),
    getByUuids: vi.fn<IAccountRepository['getByUuids']>(async () => []),
    getByUsernames: vi.fn<IAccountRepository['getByUsernames']>(async () => []),
    create: vi.fn<IAccountRepository['create']>(async (account) => account),
    update: vi.fn<IAccountRepository['update']>(async (account) => account),
  }
  const users = {
    getByUsername: vi.fn<IUserRepository['getByUsername']>(async () => null),
    getByUsernames: vi.fn<IUserRepository['getByUsernames']>(async () => []),
    save: vi.fn<IUserRepository['save']>(async (user) => user),
  }
  const reviews = {
    getById: vi.fn<IReviewRepository['getById']>(async () => null),
    getByReviewerAndUsername: vi.fn<IReviewRepository['getByReviewerAndUsername']>(
      async () => null,
    ),
    getAllForUsername: vi.fn<IReviewRepository['getAllForUsername']>(async () => []),
    getAllByReviewerUuid: vi.fn<IReviewRepository['getAllByReviewerUuid']>(async () => []),
    getReviewCountsForUsernames: vi.fn<IReviewRepository['getReviewCountsForUsernames']>(
      async () => new Map(),
    ),
    create: vi.fn<IReviewRepository['create']>(async (review) => review),
    update: vi.fn<IReviewRepository['update']>(async (review) => review),
    delete: vi.fn<IReviewRepository['delete']>(async () => {}),
    deleteAllByReviewerUuid: vi.fn<IReviewRepository['deleteAllByReviewerUuid']>(async () => 0),
  }
  const watchlist = {
    getByWatcherAndUsername: vi.fn<IWatchlistRepository['getByWatcherAndUsername']>(
      async () => null,
    ),
    getAllByWatcher: vi.fn<IWatchlistRepository['getAllByWatcher']>(async () => []),
    create: vi.fn<IWatchlistRepository['create']>(async (watch) => watch),
    delete: vi.fn<IWatchlistRepository['delete']>(async () => {}),
    deleteAllByWatcher: vi.fn<IWatchlistRepository['deleteAllByWatcher']>(async () => 0),
  }
  const accountService = new AccountService(accounts)
  const userService = new UserService(users)
  return {
    repositories: { accounts, users, reviews, watchlist },
    accountService,
    userService,
    reviewService: new ReviewService(reviews, accounts, users),
    watchlistService: new WatchlistService(watchlist, accounts, users),
    enrichmentService: new ReviewEnrichmentService(accountService, userService),
  }
}

export const PAST = new Date('2024-01-01T00:00:00.000Z')

export const makeAccount = (props: Partial<AccountProps> = {}): Account =>
  new Account({
    id: 'a1',
    uuid: randomUUID(),
    username: 'testuser',
    accessToken: 'test-token',
    createdAt: PAST,
    ...props,
  })

export const makeReview = (props: Partial<ReviewProps> = {}): Review =>
  new Review({
    id: 'r1',
    reviewerUuid: randomUUID(),
    reviewedUsername: 'bob',
    status: ReviewStatus.APPROVE,
    comment: 'Great work!',
    anonymous: false,
    createdAt: PAST,
    updatedAt: PAST,
    ...props,
  })

export const makeWatch = (props: Partial<Watch> = {}): Watch => ({
  id: 'w1',
  watcherUuid: randomUUID(),
  watchedUsername: 'bob',
  createdAt: PAST,
  ...props,
})

/** Feature flags as resolved by PostHog. */
export const flags = (openDraftProfiles: boolean) => ({
  getFeatureFlags: vi.fn(async () => ({ openDraftProfiles })),
})
