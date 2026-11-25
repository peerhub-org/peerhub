import { beforeEach, describe, expect, test } from 'vitest'
import { GetReviewsUseCase } from '../../../../src/application/reviews/use_cases/get_reviews.ts'
import { AccountNotFoundException } from '../../../../src/domain/shared/exceptions.ts'
import { User } from '../../../../src/domain/users/entities/user.ts'
import { createDomain, flags, makeAccount, makeReview, PAST } from '../../../helpers/domain.ts'

const viewer = makeAccount({ id: 'a1', username: 'Viewer' })
const other = makeAccount({ id: 'a2', username: 'other' })
const own = (id: string) => makeReview({ id, reviewerUuid: viewer.uuid })
const others = (id: string) => makeReview({ id, reviewerUuid: other.uuid })

let domain: ReturnType<typeof createDomain>
beforeEach(() => {
  domain = createDomain()
  domain.repositories.accounts.getByUuid.mockResolvedValue(viewer)
  domain.repositories.accounts.getByUuids.mockResolvedValue([viewer, other])
  domain.repositories.accounts.getByUsername.mockResolvedValue(makeAccount({ username: 'bob' }))
})

const page = (options: {
  username?: string
  open?: boolean
  limit?: number
  offset?: number
  status?: string | null
  moderators?: string[]
}) =>
  new GetReviewsUseCase(
    domain.reviewService,
    domain.accountService,
    domain.enrichmentService,
    flags(options.open ?? false),
    new Set(options.moderators),
  ).execute(options.username ?? 'bob', viewer.uuid, {
    limit: options.limit ?? 16,
    offset: options.offset ?? 0,
    status: options.status ?? null,
  })

const idsOf = (result: Awaited<ReturnType<typeof page>>) =>
  result.items.map((item) => item.review.id)

test('resolves names and avatars', async () => {
  domain.repositories.reviews.getAllForUsername.mockResolvedValue([others('r1')])
  domain.repositories.users.getByUsernames.mockResolvedValue([
    new User({ username: 'other', avatarUrl: 'https://example.com/other.png' }),
  ])
  expect(await page({})).toMatchObject({
    items: [{ reviewerUsername: 'other', reviewerAvatarUrl: 'https://example.com/other.png' }],
    hasMore: false,
    isPageOwner: false,
    isModerator: false,
  })
})

test('asks for one more review to know about the next page', async () => {
  domain.repositories.reviews.getAllForUsername.mockResolvedValue([others('r1'), others('r2')])
  const result = await page({ limit: 1, offset: 3, status: 'approve' })
  expect(idsOf(result)).toEqual(['r1'])
  expect(result.hasMore).toBe(true)
  expect(domain.repositories.reviews.getAllForUsername).toHaveBeenCalledExactlyOnceWith(
    'bob',
    2,
    3,
    'approve',
  )
  expect((await page({ limit: 2 })).hasMore).toBe(false)
})

test('leaves out deleted reviewers', async () => {
  domain.repositories.reviews.getAllForUsername.mockResolvedValue([others('r1')])
  domain.repositories.accounts.getByUuids.mockResolvedValue([
    makeAccount({ uuid: other.uuid, deletedAt: PAST }),
  ])
  expect(idsOf(await page({}))).toEqual([])
})

test('tells page owner, whatever the case, and moderator', async () => {
  expect(await page({ username: 'vIEWER' })).toMatchObject({
    isPageOwner: true,
    isModerator: false,
  })
  expect(await page({ moderators: ['Viewer'] })).toMatchObject({
    isPageOwner: false,
    isModerator: true,
  })
  expect((await page({ moderators: ['viewer'] })).isModerator).toBe(false)
})

describe('draft profiles', () => {
  beforeEach(() => {
    domain.repositories.accounts.getByUsername.mockResolvedValue(null)
    domain.repositories.reviews.getAllForUsername.mockResolvedValue([
      others('r1'),
      own('r2'),
      others('r3'),
      own('r4'),
      own('r5'),
    ])
  })

  test('closed: only the reviews of the viewer, from all of them', async () => {
    const result = await page({ status: 'approve' })
    expect(idsOf(result)).toEqual(['r2', 'r4', 'r5'])
    expect(result.hasMore).toBe(false)
    expect(domain.repositories.reviews.getAllForUsername).toHaveBeenCalledExactlyOnceWith(
      'bob',
      0,
      0,
      'approve',
    )
  })

  test('closed: pages what the viewer may see', async () => {
    const first = await page({ limit: 2 })
    expect([idsOf(first), first.hasMore]).toEqual([['r2', 'r4'], true])
    const second = await page({ limit: 2, offset: 2 })
    expect([idsOf(second), second.hasMore]).toEqual([['r5'], false])
  })

  test('open: everything', async () => {
    expect(idsOf(await page({ open: true }))).toEqual(['r1', 'r2', 'r3', 'r4', 'r5'])
  })
})

test('a deleted profile is not a draft', async () => {
  domain.repositories.accounts.getByUsername.mockResolvedValue(makeAccount({ deletedAt: PAST }))
  domain.repositories.reviews.getAllForUsername.mockResolvedValue([others('r1')])
  expect(idsOf(await page({ open: false }))).toEqual(['r1'])
})

test('fails for an unknown viewer', async () => {
  domain.repositories.accounts.getByUuid.mockResolvedValue(null)
  await expect(page({})).rejects.toThrow(AccountNotFoundException)
})
