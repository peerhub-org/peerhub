import { expect, test } from 'vitest'
import { ReviewStatus } from '../../../../../src/domain/reviews/entities/review.ts'
import { makeReview, PAST } from '../../../../helpers/domain.ts'

test('updateStatus changes status, comment and updatedAt only', () => {
  const review = makeReview({ anonymous: true, commentHidden: true, commentHiddenBy: 'bob' })
  review.updateStatus(ReviewStatus.REQUEST_CHANGE, 'Needs work')
  expect(review).toMatchObject({
    status: 'request_change',
    comment: 'Needs work',
    anonymous: true,
    commentHidden: true,
    commentHiddenBy: 'bob',
    createdAt: PAST,
  })
  expect(review.updatedAt > PAST).toBe(true)
})

test('hides a comment', () => {
  const review = makeReview()
  review.setCommentHidden(true, 'alice')
  expect(review).toMatchObject({ commentHidden: true, commentHiddenBy: 'alice' })
  expect(review.updatedAt > PAST).toBe(true)
})

test('shows a comment again', () => {
  const review = makeReview({ commentHidden: true, commentHiddenBy: 'alice' })
  review.setCommentHidden(false)
  expect(review).toMatchObject({ commentHidden: false, commentHiddenBy: null })
  expect(review.updatedAt > PAST).toBe(true)
})
