import { beforeEach, describe, expect, test, vi } from 'vitest'
import { GetSuggestionsUseCase } from '../../../../src/application/reviews/use_cases/get_suggestions.ts'
import { AccessTokenMissingException } from '../../../../src/domain/shared/exceptions.ts'
import type { GitHubListedUser } from '../../../../src/infrastructure/github/external/github_client.ts'
import { createDomain, makeAccount, makeReview, makeWatch, PAST } from '../../../helpers/domain.ts'

const me = makeAccount({ username: 'Me', accessToken: 'gho_me' })
const follows = (login: string | null, type: string | null = 'User'): GitHubListedUser => ({
  login,
  avatarUrl: login && `https://example.com/${login}.png`,
  type,
})

let domain: ReturnType<typeof createDomain>
let following: GitHubListedUser[]
const fetchFollowingSample = vi.fn(async () => following)
beforeEach(() => {
  domain = createDomain()
  domain.repositories.accounts.getByUuid.mockResolvedValue(me)
  fetchFollowingSample.mockClear()
})

const suggestions = (limit = 16) =>
  new GetSuggestionsUseCase(domain.accountService, domain.watchlistService, domain.reviewService, {
    fetchFollowingSample,
  }).execute(me.uuid, limit)
const names = async (limit?: number) => (await suggestions(limit)).map((s) => s.username)

test('returns username and avatar only', async () => {
  following = [follows('alice')]
  expect(await suggestions()).toEqual([
    { username: 'alice', avatarUrl: 'https://example.com/alice.png' },
  ])
  expect(fetchFollowingSample).toHaveBeenCalledExactlyOnceWith('Me', 'gho_me')
})

describe('candidates', () => {
  test('are regular users only', async () => {
    following = [
      follows('alice'),
      follows('some-org', 'Organization'),
      follows('dependabot', 'Bot'),
      follows('unknown', null),
      follows(null),
      follows('bob'),
    ]
    expect((await names()).sort()).toEqual(['alice', 'bob'])
  })

  test('are not the user, nor who they watch or reviewed, whatever the case', async () => {
    domain.repositories.watchlist.getAllByWatcher.mockResolvedValue([
      makeWatch({ watchedUsername: 'Watched' }),
    ])
    domain.repositories.reviews.getAllByReviewerUuid.mockResolvedValue([
      makeReview({ reviewedUsername: 'reviewed' }),
    ])
    following = [follows('ME'), follows('wATCHED'), follows('Reviewed'), follows('alice')]
    expect(await names()).toEqual(['alice'])
    expect(domain.repositories.watchlist.getAllByWatcher).toHaveBeenCalledWith(me.uuid, 500, 0)
    expect(domain.repositories.reviews.getAllByReviewerUuid).toHaveBeenCalledWith(me.uuid, 500, 0)
  })

  test('have not deleted their account', async () => {
    domain.repositories.accounts.getByUsernames.mockResolvedValue([
      makeAccount({ username: 'Ghost', deletedAt: PAST }),
    ])
    following = [follows('ghost'), follows('alice')]
    expect(await names()).toEqual(['alice'])
  })

  test('none: the database is not asked', async () => {
    following = []
    expect(await names()).toEqual([])
    expect(domain.repositories.accounts.getByUsernames).not.toHaveBeenCalled()
  })
})

describe('order', () => {
  beforeEach(() => {
    domain.repositories.accounts.getByUsernames.mockResolvedValue([
      makeAccount({ username: 'Open2' }),
      makeAccount({ username: 'open1' }),
      makeAccount({ username: 'openreviewed' }),
    ])
    domain.repositories.reviews.getReviewCountsForUsernames.mockResolvedValue(
      new Map([
        ['few', 1],
        ['many', 9],
        ['openreviewed', 3],
      ]),
    )
    following = ['rest1', 'few', 'Open2', 'many', 'rest2', 'open1', 'openreviewed', 'rest3'].map(
      (login) => follows(login),
    )
  })

  test('open accounts, then most reviewed, then the rest', async () => {
    const result = await names()
    expect(result.slice(0, 5)).toEqual(['openreviewed', 'open1', 'Open2', 'many', 'few'])
    expect(result.slice(5).sort()).toEqual(['rest1', 'rest2', 'rest3'])
  })

  test('the rest is shuffled', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    expect((await names()).slice(5)).toEqual(['rest2', 'rest3', 'rest1'])
    random.mockRestore()
  })

  test('the limit keeps the best', async () => {
    expect(await names(2)).toEqual(['openreviewed', 'open1'])
  })

  // Task 52: counts are keyed by the stored spelling.
  test('counts of mixed-case usernames are missed', async () => {
    domain.repositories.reviews.getReviewCountsForUsernames.mockResolvedValue(
      new Map([['Mixed', 9]]),
    )
    following = [follows('Mixed'), follows('open1')]
    expect(await names()).toEqual(['open1', 'Mixed'])
  })
})

test('needs a GitHub token', async () => {
  domain.repositories.accounts.getByUuid.mockResolvedValue(makeAccount({ accessToken: '' }))
  await expect(suggestions()).rejects.toThrow(AccessTokenMissingException)
  expect(fetchFollowingSample).not.toHaveBeenCalled()
})
