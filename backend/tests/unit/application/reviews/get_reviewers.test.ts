import { beforeEach, expect, test } from 'vitest'
import { GetReviewersUseCase } from '../../../../src/application/reviews/use_cases/get_reviewers.ts'
import { User } from '../../../../src/domain/users/entities/user.ts'
import { createDomain, flags, makeAccount, makeReview, PAST } from '../../../helpers/domain.ts'

const alice = makeAccount({ id: 'a1', username: 'alice' })
const charlie = makeAccount({ id: 'a2', username: 'charlie' })
const reviews = [
  makeReview({ id: 'r1', reviewerUuid: alice.uuid }),
  makeReview({ id: 'r2', reviewerUuid: charlie.uuid }),
]

let domain: ReturnType<typeof createDomain>
beforeEach(() => {
  domain = createDomain()
  const { accounts, users, reviews: reviewRepository } = domain.repositories
  reviewRepository.getAllForUsername.mockResolvedValue(reviews)
  accounts.getByUuids.mockResolvedValue([alice, charlie])
  accounts.getByUsername.mockResolvedValue(makeAccount({ username: 'Bob' }))
  users.getByUsername.mockResolvedValue(new User({ username: 'Bob' }))
  users.getByUsernames.mockResolvedValue([
    new User({ username: 'alice', avatarUrl: 'https://example.com/alice.png' }),
  ])
})

const reviewersOf = (username: string, open = false) =>
  new GetReviewersUseCase(
    domain.reviewService,
    domain.accountService,
    domain.userService,
    domain.enrichmentService,
    flags(open),
  ).execute(username, alice.uuid)

test('resolves names and avatars', async () => {
  expect(await reviewersOf('bob')).toEqual([
    {
      review: reviews[0],
      reviewerUsername: 'alice',
      reviewerAvatarUrl: 'https://example.com/alice.png',
    },
    { review: reviews[1], reviewerUsername: 'charlie', reviewerAvatarUrl: null },
  ])
  expect(domain.repositories.reviews.getAllForUsername).toHaveBeenCalledExactlyOnceWith(
    'bob',
    512,
    0,
    null,
  )
})

test('leaves out deleted reviewers', async () => {
  domain.repositories.accounts.getByUuids.mockResolvedValue([
    alice,
    makeAccount({ uuid: charlie.uuid, deletedAt: PAST }),
  ])
  expect((await reviewersOf('bob')).map((r) => r.reviewerUsername)).toEqual(['alice'])
})

test('is empty for an account without profile', async () => {
  domain.repositories.users.getByUsername.mockResolvedValue(null)
  expect(await reviewersOf('bob')).toEqual([])
  expect(domain.repositories.users.getByUsername).toHaveBeenCalledExactlyOnceWith('Bob')
  expect(domain.repositories.reviews.getAllForUsername).not.toHaveBeenCalled()
})

test('of a draft are only the viewer, unless drafts are open', async () => {
  domain.repositories.accounts.getByUsername.mockResolvedValue(null)
  expect((await reviewersOf('bob', false)).map((r) => r.reviewerUsername)).toEqual(['alice'])
  expect((await reviewersOf('bob', true)).map((r) => r.reviewerUsername)).toEqual([
    'alice',
    'charlie',
  ])
})
