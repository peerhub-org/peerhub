import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, test } from 'vitest'
import { ReviewStatus, type Review } from '../../../../../src/domain/reviews/entities/review.ts'
import type { CreateOrUpdateReview } from '../../../../../src/domain/reviews/services/review_service.ts'
import {
  AnonymousFieldImmutableException,
  DuplicateEntityError,
  NotUserTypeException,
  ReviewValidationException,
  SelfReviewException,
} from '../../../../../src/domain/shared/exceptions.ts'
import { User } from '../../../../../src/domain/users/entities/user.ts'
import { createDomain, makeAccount, makeReview, PAST } from '../../../../helpers/domain.ts'

const reviewer = makeAccount({ username: 'reviewer' })

let domain: ReturnType<typeof createDomain>
beforeEach(() => {
  domain = createDomain()
  domain.repositories.accounts.getByUuid.mockResolvedValue(reviewer)
})

const submit = (input: Partial<CreateOrUpdateReview> = {}) =>
  domain.reviewService.createOrUpdateReview({
    reviewerUuid: reviewer.uuid,
    reviewedUsername: 'bob',
    status: ReviewStatus.APPROVE,
    comment: 'Nice!',
    anonymous: false,
    ...input,
  })

describe('createOrUpdateReview', () => {
  test('creates a review', async () => {
    const { review, isNew } = await submit({ comment: '  Nice!\r\n', anonymous: true })
    expect(isNew).toBe(true)
    expect(review).toMatchObject({
      id: null,
      reviewerUuid: reviewer.uuid,
      reviewedUsername: 'bob',
      status: 'approve',
      comment: 'Nice!',
      anonymous: true,
      commentHidden: false,
      commentHiddenBy: null,
    })
    expect(review.createdAt).toEqual(review.updatedAt)
    expect(domain.repositories.reviews.create).toHaveBeenCalledExactlyOnceWith(review)
  })

  test('updates an existing review', async () => {
    const existing = makeReview({ reviewerUuid: reviewer.uuid })
    domain.repositories.reviews.getByReviewerAndUsername.mockResolvedValue(existing)
    const { review, isNew } = await submit({ status: 'request_change', comment: 'Fix this' })
    expect(isNew).toBe(false)
    expect(review).toMatchObject({
      id: 'r1',
      status: 'request_change',
      comment: 'Fix this',
      createdAt: PAST,
    })
    expect(domain.repositories.reviews.update).toHaveBeenCalledExactlyOnceWith(existing)
    expect(domain.repositories.reviews.create).not.toHaveBeenCalled()
  })

  describe('when another request creates the review first', () => {
    const created = () => makeReview({ reviewerUuid: reviewer.uuid })
    beforeEach(() => {
      domain.repositories.reviews.create.mockRejectedValue(new DuplicateEntityError(null))
    })
    const race = (second: Review | null) =>
      domain.repositories.reviews.getByReviewerAndUsername
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(second)

    test('updates it', async () => {
      race(created())
      const { review, isNew } = await submit({ comment: 'mine' })
      expect(isNew).toBe(false)
      expect(review).toMatchObject({ id: 'r1', comment: 'mine' })
    })

    test('still refuses to change anonymity', async () => {
      race(created())
      await expect(submit({ anonymous: true })).rejects.toThrow(AnonymousFieldImmutableException)
    })

    test('fails if it is gone again', async () => {
      race(null)
      await expect(submit()).rejects.toThrow(DuplicateEntityError)
    })
  })

  test('other failures to create are not hidden', async () => {
    domain.repositories.reviews.create.mockRejectedValue(new Error('db down'))
    await expect(submit()).rejects.toThrow('db down')
  })

  test('refuses to review yourself, whatever the case', async () => {
    await expect(submit({ reviewedUsername: 'Reviewer' })).rejects.toThrow(SelfReviewException)
  })

  test.each([null, '', '   ', '​'])('requires a comment for status comment: %j', async (c) => {
    await expect(submit({ status: 'comment', comment: c })).rejects.toThrow('Comment is required')
  })

  test.each(['x', '\u{1F600}'])('limits the comment to 1024 code points of %s', async (char) => {
    const { review } = await submit({ comment: char.repeat(1024) })
    expect(review.comment).toBe(char.repeat(1024))
    const tooLong = submit({ comment: char.repeat(1025) })
    await expect(tooLong).rejects.toThrow(ReviewValidationException)
    await expect(tooLong).rejects.toThrow('exceeds maximum length')
  })

  test('measures the comment after normalization', async () => {
    // Each ligature becomes two letters.
    await expect(submit({ comment: 'ﬁ'.repeat(600) })).rejects.toThrow('exceeds maximum')
  })

  test('refuses to change anonymity', async () => {
    domain.repositories.reviews.getByReviewerAndUsername.mockResolvedValue(makeReview())
    await expect(submit({ anonymous: true })).rejects.toThrow(AnonymousFieldImmutableException)
    expect(domain.repositories.reviews.update).not.toHaveBeenCalled()
  })

  test.each(['Organization', 'Bot', null])('refuses a target of type %s', async (type) => {
    domain.repositories.users.getByUsername.mockResolvedValue(new User({ username: 'bob', type }))
    await expect(submit()).rejects.toThrow(NotUserTypeException)
  })

  test('accepts a target of type User', async () => {
    domain.repositories.users.getByUsername.mockResolvedValue(
      new User({ username: 'bob', type: 'User' }),
    )
    expect((await submit()).isNew).toBe(true)
  })
})

describe('queries', () => {
  const found = [makeReview()]

  test('reviews for a user', async () => {
    domain.repositories.reviews.getAllForUsername.mockResolvedValue(found)
    expect(await domain.reviewService.getReviewsForUser('bob')).toBe(found)
    expect(domain.repositories.reviews.getAllForUsername).toHaveBeenLastCalledWith(
      'bob',
      100,
      0,
      null,
    )
    // 0 means "no limit" and must not be replaced by the default.
    await domain.reviewService.getReviewsForUser('bob', 0, 5, 'approve')
    expect(domain.repositories.reviews.getAllForUsername).toHaveBeenLastCalledWith(
      'bob',
      0,
      5,
      'approve',
    )
  })

  test('reviews by a reviewer', async () => {
    domain.repositories.reviews.getAllByReviewerUuid.mockResolvedValue(found)
    expect(await domain.reviewService.getReviewsByReviewer(reviewer.uuid)).toBe(found)
    expect(domain.repositories.reviews.getAllByReviewerUuid).toHaveBeenCalledExactlyOnceWith(
      reviewer.uuid,
      100,
      0,
    )
  })
})

describe('deleteReview', () => {
  test('deletes an existing review', async () => {
    domain.repositories.reviews.getByReviewerAndUsername.mockResolvedValue(makeReview())
    await domain.reviewService.deleteReview(reviewer.uuid, 'bob')
    expect(domain.repositories.reviews.delete).toHaveBeenCalledExactlyOnceWith('r1')
  })

  test('ignores a missing review', async () => {
    await domain.reviewService.deleteReview(randomUUID(), 'nobody')
    expect(domain.repositories.reviews.delete).not.toHaveBeenCalled()
  })
})
