import { beforeEach, describe, expect, test } from 'vitest'
import { GetActivityFeedUseCase } from '../../../../src/application/accounts/use_cases/get_activity_feed.ts'
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
const avatar = (username: string) =>
  new User({ username, avatarUrl: `https://example.com/${username}.png` })
const received = makeReview({ reviewerUuid: alice.uuid, reviewedUsername: 'bob' })

let domain: ReturnType<typeof createDomain>
let featureFlags: ReturnType<typeof flags>

beforeEach(() => {
  domain = createDomain()
  featureFlags = flags(true)
  const { accounts, users, reviews } = domain.repositories
  accounts.getByUuid.mockResolvedValue(bob)
  accounts.getByUuids.mockResolvedValue([alice])
  accounts.getByUsernames.mockResolvedValue([bob])
  users.getByUsernames.mockResolvedValue([avatar('alice'), avatar('bob')])
  reviews.getFeed.mockResolvedValue([received])
})

const feed = (filter: 'all' | 'mine' | 'watching' = 'mine') =>
  new GetActivityFeedUseCase(
    domain.watchlistService,
    domain.reviewService,
    domain.accountService,
    domain.userService,
    featureFlags,
  ).execute(bob.uuid, filter, 10, 5)

describe('items', () => {
  test('have names and avatars, whatever the case', async () => {
    expect(await feed()).toEqual([
      {
        review: received,
        reviewerUsername: 'alice',
        reviewerAvatarUrl: 'https://example.com/alice.png',
        reviewedUserAvatarUrl: 'https://example.com/bob.png',
      },
    ])
  })

  test('do not reveal who wrote an anonymous review', async () => {
    domain.repositories.reviews.getFeed.mockResolvedValue([
      makeReview({ reviewerUuid: alice.uuid, reviewedUsername: 'bob', anonymous: true }),
    ])
    expect(await feed()).toMatchObject([
      {
        reviewerUsername: null,
        reviewerAvatarUrl: null,
        reviewedUserAvatarUrl: 'https://example.com/bob.png',
      },
    ])
  })

  test('may lack profiles', async () => {
    domain.repositories.users.getByUsernames.mockResolvedValue([])
    expect(await feed()).toMatchObject([
      { reviewerUsername: 'alice', reviewerAvatarUrl: null, reviewedUserAvatarUrl: null },
    ])
  })

  test('need an active reviewer, even if deleted in the meantime', async () => {
    domain.repositories.accounts.getByUuids.mockResolvedValue([
      makeAccount({ uuid: alice.uuid, deletedAt: PAST }),
    ])
    expect(await feed()).toEqual([])
    domain.repositories.accounts.getByUuids.mockResolvedValue([])
    expect(await feed()).toEqual([])
  })

  test('may be none', async () => {
    domain.repositories.reviews.getFeed.mockResolvedValue([])
    expect(await feed()).toEqual([])
  })
})

describe('profiles in the feed', () => {
  const carol = makeAccount({ username: 'Carol' })
  const ghost = makeAccount({ username: 'ghost', deletedAt: PAST })
  const asked = () => domain.repositories.reviews.getFeed.mock.calls.at(-1)!

  beforeEach(() => {
    domain.repositories.accounts.getByUsernames.mockResolvedValue([bob, carol, ghost])
    domain.repositories.watchlist.getAllByWatcher.mockResolvedValue(
      ['carol', 'GHOST', 'draft'].map((name) => makeWatch({ watchedUsername: name })),
    )
  })

  test.each([
    ['all', ['Bob', 'carol', 'draft']],
    ['mine', ['Bob']],
    ['watching', ['carol', 'draft']],
  ] as const)('%s, without deleted ones', async (filter, usernames) => {
    await feed(filter)
    expect(asked()).toEqual([{ usernames, onlyByViewer: [], viewerUuid: bob.uuid }, 10, 5])
  })

  test('when drafts are closed, only with what the viewer wrote about drafts', async () => {
    featureFlags = flags(false)
    await feed('all')
    expect(asked()[0]).toEqual({
      usernames: ['Bob', 'carol'],
      onlyByViewer: ['draft'],
      viewerUuid: bob.uuid,
    })
  })

  test('are all the watched ones', async () => {
    await feed('watching')
    expect(domain.repositories.watchlist.getAllByWatcher).toHaveBeenCalledExactlyOnceWith(
      bob.uuid,
      0,
      0,
    )
  })

  test('the flag is only asked for when there are drafts', async () => {
    await feed('mine')
    expect(featureFlags.getFeatureFlags).not.toHaveBeenCalled()
  })
})

test('fails for an unknown account', async () => {
  domain.repositories.accounts.getByUuid.mockResolvedValue(null)
  await expect(feed()).rejects.toThrow(AccountNotFoundException)
})
