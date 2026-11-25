import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, test } from 'vitest'
import { GetActivityFeedUseCase } from '../../../../src/application/accounts/use_cases/get_activity_feed.ts'
import type { Review } from '../../../../src/domain/reviews/entities/review.ts'
import { AccountNotFoundException } from '../../../../src/domain/shared/exceptions.ts'
import { User } from '../../../../src/domain/users/entities/user.ts'
import {
  createDomain,
  flags,
  makeAccount,
  makeReview,
  makeWatch,
  PAST,
} from '../../../helpers/domain.ts'

const bob = makeAccount({ id: 'a1', username: 'Bob' })
const alice = makeAccount({ id: 'a2', username: 'alice' })
const day = (n: number) => new Date(PAST.getTime() + n * 24 * 60 * 60 * 1000)
const avatar = (username: string) =>
  new User({ username, avatarUrl: `https://example.com/${username}.png` })

let domain: ReturnType<typeof createDomain>
let reviewsByUsername: Record<string, Review[]>

beforeEach(() => {
  domain = createDomain()
  reviewsByUsername = {}
  const { accounts, users, reviews } = domain.repositories
  accounts.getByUuid.mockResolvedValue(bob)
  accounts.getByUuids.mockResolvedValue([alice, bob])
  accounts.getByUsernames.mockResolvedValue([bob])
  users.getByUsernames.mockResolvedValue([avatar('alice'), avatar('bob')])
  reviews.getAllForUsername.mockImplementation(async (name) => reviewsByUsername[name] ?? [])
})

const feed = (filter: 'all' | 'mine' | 'watching' = 'mine', open = false, limit = 50, offset = 0) =>
  new GetActivityFeedUseCase(
    domain.watchlistService,
    domain.reviewService,
    domain.accountService,
    domain.userService,
    flags(open),
  ).execute(bob.uuid, filter, limit, offset)

const ids = async (...args: Parameters<typeof feed>) =>
  (await feed(...args)).map((item) => item.review.id)

const received = (props: Partial<Review> = {}) =>
  makeReview({ reviewerUuid: alice.uuid, reviewedUsername: 'bob', ...props })

test('resolves names and avatars, whatever the case', async () => {
  reviewsByUsername.Bob = [received()]
  expect(await feed()).toEqual([
    {
      review: reviewsByUsername.Bob[0],
      reviewerUsername: 'alice',
      reviewerAvatarUrl: 'https://example.com/alice.png',
      reviewedUserAvatarUrl: 'https://example.com/bob.png',
    },
  ])
})

test('does not reveal who wrote an anonymous review', async () => {
  reviewsByUsername.Bob = [received({ anonymous: true })]
  expect(await feed()).toMatchObject([
    {
      reviewerUsername: null,
      reviewerAvatarUrl: null,
      reviewedUserAvatarUrl: 'https://example.com/bob.png',
    },
  ])
})

test('accepts missing profiles', async () => {
  domain.repositories.users.getByUsernames.mockResolvedValue([])
  reviewsByUsername.Bob = [received()]
  expect(await feed()).toMatchObject([
    { reviewerUsername: 'alice', reviewerAvatarUrl: null, reviewedUserAvatarUrl: null },
  ])
})

describe('filters', () => {
  beforeEach(() => {
    domain.repositories.watchlist.getAllByWatcher.mockResolvedValue([
      makeWatch({ watchedUsername: 'carol' }),
      makeWatch({ watchedUsername: 'dave' }),
    ])
    domain.repositories.accounts.getByUsernames.mockResolvedValue([
      bob,
      makeAccount({ username: 'carol' }),
      makeAccount({ username: 'dave' }),
    ])
    reviewsByUsername = {
      Bob: [received({ id: 'mine', updatedAt: day(2) })],
      carol: [received({ id: 'carol', reviewedUsername: 'carol', updatedAt: day(3) })],
      dave: [received({ id: 'dave', reviewedUsername: 'dave', updatedAt: day(1) })],
    }
  })

  test.each([
    ['all', ['carol', 'mine', 'dave']],
    ['mine', ['mine']],
    ['watching', ['carol', 'dave']],
  ] as const)('%s, most recently updated first', async (filter, expected) => {
    expect(await ids(filter)).toEqual(expected)
  })

  test('pages', async () => {
    expect(await ids('all', false, 2, 0)).toEqual(['carol', 'mine'])
    expect(await ids('all', false, 2, 2)).toEqual(['dave'])
    expect(await ids('all', false, 2, 3)).toEqual([])
  })
})

describe('what is left out', () => {
  // Task 54: they still take a place in the page, as in the Python backend.
  test('reviews by deleted reviewers, only after paging', async () => {
    const ghost = makeAccount({ deletedAt: PAST })
    domain.repositories.accounts.getByUuids.mockResolvedValue([alice, ghost])
    reviewsByUsername.Bob = [
      received({ id: 'ghost', reviewerUuid: ghost.uuid, updatedAt: day(2) }),
      received({ id: 'alice', updatedAt: day(1) }),
    ]
    expect(await ids('mine', false, 1, 0)).toEqual([])
    expect(await ids('mine', false, 2, 0)).toEqual(['alice'])
  })

  test('reviews by deleted or unknown reviewers', async () => {
    domain.repositories.accounts.getByUuids.mockResolvedValue([
      makeAccount({ uuid: alice.uuid, deletedAt: PAST }),
    ])
    reviewsByUsername.Bob = [received(), received({ reviewerUuid: randomUUID() })]
    expect(await ids()).toEqual([])
  })

  test('reviews of deleted profiles, even when drafts are open', async () => {
    domain.repositories.accounts.getByUsernames.mockResolvedValue([
      makeAccount({ username: 'bob', deletedAt: PAST }),
    ])
    reviewsByUsername.Bob = [received()]
    expect(await ids('mine', true)).toEqual([])
  })

  test('reviews of drafts by others, unless drafts are open', async () => {
    domain.repositories.accounts.getByUsernames.mockResolvedValue([])
    reviewsByUsername.Bob = [
      received({ id: 'others' }),
      received({ id: 'own', reviewerUuid: bob.uuid }),
    ]
    expect(await ids('mine', false)).toEqual(['own'])
    expect(await ids('mine', true)).toEqual(['others', 'own'])
  })
})

test('fails for an unknown account', async () => {
  domain.repositories.accounts.getByUuid.mockResolvedValue(null)
  await expect(feed()).rejects.toThrow(AccountNotFoundException)
})
