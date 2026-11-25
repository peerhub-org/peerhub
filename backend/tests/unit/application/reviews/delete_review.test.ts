import { expect, test } from 'vitest'
import { DeleteReviewUseCase } from '../../../../src/application/reviews/use_cases/delete_review.ts'
import { createDomain, makeReview } from '../../../helpers/domain.ts'

test('deletes the review of the current user about the given one', async () => {
  const { reviewService, repositories } = createDomain()
  const review = makeReview()
  repositories.reviews.getByReviewerAndUsername.mockResolvedValue(review)
  await new DeleteReviewUseCase(reviewService).execute(review.reviewerUuid, 'bob')
  expect(repositories.reviews.getByReviewerAndUsername).toHaveBeenCalledExactlyOnceWith(
    review.reviewerUuid,
    'bob',
  )
  expect(repositories.reviews.delete).toHaveBeenCalledExactlyOnceWith('r1')
})
