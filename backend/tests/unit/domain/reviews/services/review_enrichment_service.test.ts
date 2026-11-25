import { beforeEach, expect, test } from 'vitest'
import { User } from '../../../../../src/domain/users/entities/user.ts'
import { createDomain, makeAccount, makeReview, PAST } from '../../../../helpers/domain.ts'

let domain: ReturnType<typeof createDomain>
beforeEach(() => void (domain = createDomain()))

const alice = makeAccount({ username: 'Alice' })
const review = makeReview({ reviewerUuid: alice.uuid })

test('resolves username and avatar, whatever the case', async () => {
  domain.repositories.accounts.getByUuids.mockResolvedValue([alice])
  domain.repositories.users.getByUsernames.mockResolvedValue([
    new User({ username: 'alice', avatarUrl: 'https://example.test/alice.png' }),
  ])
  expect(await domain.enrichmentService.enrichReviews([review])).toEqual([
    {
      review,
      reviewerUsername: 'Alice',
      reviewerAvatarUrl: 'https://example.test/alice.png',
    },
  ])
})

test('accepts a reviewer without profile', async () => {
  domain.repositories.accounts.getByUuids.mockResolvedValue([alice])
  expect(await domain.enrichmentService.enrichReviews([review])).toEqual([
    { review, reviewerUsername: 'Alice', reviewerAvatarUrl: null },
  ])
})

test('leaves out deleted reviewers and does not look up their profiles', async () => {
  domain.repositories.accounts.getByUuids.mockResolvedValue([
    makeAccount({ uuid: alice.uuid, deletedAt: PAST }),
  ])
  expect(await domain.enrichmentService.enrichReviews([review])).toEqual([])
  expect(domain.repositories.users.getByUsernames).toHaveBeenCalledExactlyOnceWith([])
})

test('leaves out unknown reviewers and keeps the order of the others', async () => {
  const second = makeReview({ id: 'r2', reviewerUuid: alice.uuid })
  domain.repositories.accounts.getByUuids.mockResolvedValue([alice])
  const result = await domain.enrichmentService.enrichReviews([
    second,
    makeReview({ id: 'unknown' }),
    review,
  ])
  expect(result.map((item) => item.review.id)).toEqual(['r2', 'r1'])
})

test('asks for each reviewer once', async () => {
  await domain.enrichmentService.enrichReviews([review, review])
  expect(domain.repositories.accounts.getByUuids).toHaveBeenCalledExactlyOnceWith([alice.uuid])
})

test('does nothing for an empty list', async () => {
  expect(await domain.enrichmentService.enrichReviews([])).toEqual([])
  expect(domain.repositories.accounts.getByUuids).not.toHaveBeenCalled()
})
