import { expect, test, vi } from 'vitest'
import { CreateOrUpdateReviewUseCase } from '../../../../src/application/reviews/use_cases/create_or_update_review.ts'
import type { CreateOrUpdateReview } from '../../../../src/domain/reviews/services/review_service.ts'
import {
  AccountNotFoundException,
  SelfReviewException,
} from '../../../../src/domain/shared/exceptions.ts'
import { User } from '../../../../src/domain/users/entities/user.ts'
import { createDomain, makeAccount, makeReview, PAST } from '../../../helpers/domain.ts'
import { memoryLogger } from '../../../helpers/logger.ts'

const alice = makeAccount({ username: 'alice' })
const input: CreateOrUpdateReview = {
  reviewerUuid: alice.uuid,
  reviewedUsername: 'bob',
  status: 'approve',
  comment: 'Looks good!',
  anonymous: true,
}

function setup() {
  const domain = createDomain()
  domain.repositories.accounts.getByUuid.mockResolvedValue(alice)
  domain.repositories.accounts.getByUuids.mockResolvedValue([alice])
  domain.repositories.users.getByUsernames.mockResolvedValue([
    new User({ username: 'alice', avatarUrl: 'https://example.com/alice.png' }),
  ])
  const sendNewReviewNotification = vi.fn(async () => {})
  const { logger, lines } = memoryLogger()
  const useCase = new CreateOrUpdateReviewUseCase(
    domain.reviewService,
    domain.accountService,
    domain.enrichmentService,
    domain.watchlistService,
    { sendNewReviewNotification },
    logger,
  )
  return { ...domain, useCase, sendNewReviewNotification, lines }
}

test('creates the review, notifies and watches the user', async () => {
  const { useCase, repositories, sendNewReviewNotification, lines } = setup()
  expect(await useCase.execute(input)).toMatchObject({
    review: { reviewerUuid: alice.uuid, reviewedUsername: 'bob', comment: 'Looks good!' },
    reviewerUsername: 'alice',
    reviewerAvatarUrl: 'https://example.com/alice.png',
  })
  expect(sendNewReviewNotification).toHaveBeenCalledExactlyOnceWith({
    reviewerUsername: 'alice',
    reviewedUsername: 'bob',
    status: 'approve',
    comment: 'Looks good!',
    anonymous: true,
  })
  expect(repositories.watchlist.create).toHaveBeenCalledOnce()
  expect(lines).toEqual([])
})

test('an update watches the user but does not notify', async () => {
  const { useCase, repositories, sendNewReviewNotification } = setup()
  repositories.reviews.getByReviewerAndUsername.mockResolvedValue(
    makeReview({ reviewerUuid: alice.uuid, anonymous: true }),
  )
  expect((await useCase.execute(input)).review.id).toBe('r1')
  expect(sendNewReviewNotification).not.toHaveBeenCalled()
  expect(repositories.watchlist.create).toHaveBeenCalledOnce()
})

test('survives failures to notify and to watch', async () => {
  const { useCase, repositories, sendNewReviewNotification, lines } = setup()
  sendNewReviewNotification.mockRejectedValue(new Error('provider down'))
  repositories.watchlist.create.mockRejectedValue(new Error('db down'))
  expect((await useCase.execute(input)).reviewerUsername).toBe('alice')
  expect(lines.map((line) => line.message)).toEqual([
    'Failed to send new review notification email',
    'Failed to auto-watch user after review submission',
  ])
})

test('does nothing else when the review is refused', async () => {
  const { useCase, repositories, sendNewReviewNotification } = setup()
  await expect(useCase.execute({ ...input, reviewedUsername: 'Alice' })).rejects.toThrow(
    SelfReviewException,
  )
  expect(sendNewReviewNotification).not.toHaveBeenCalled()
  expect(repositories.watchlist.create).not.toHaveBeenCalled()
})

test.each([
  ['deleted', makeAccount({ uuid: alice.uuid, deletedAt: PAST })],
  ['unknown', null],
])('stores nothing for a(n) %s account', async (_, account) => {
  const { useCase, repositories, sendNewReviewNotification } = setup()
  repositories.accounts.getByUuid.mockResolvedValue(account)
  await expect(useCase.execute(input)).rejects.toThrow(AccountNotFoundException)
  expect(repositories.reviews.create).not.toHaveBeenCalled()
  expect(repositories.watchlist.create).not.toHaveBeenCalled()
  expect(sendNewReviewNotification).not.toHaveBeenCalled()
})
