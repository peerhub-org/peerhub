import { expect, test } from 'vitest'
import { GetMyReviewsUseCase } from '../../../../src/application/reviews/use_cases/get_my_reviews.ts'
import { createDomain, makeAccount, makeReview } from '../../../helpers/domain.ts'

const alice = makeAccount({ username: 'alice' })

test('returns the reviews of the current user', async () => {
  const { reviewService, enrichmentService, repositories } = createDomain()
  const review = makeReview({ reviewerUuid: alice.uuid, anonymous: true })
  repositories.reviews.getAllByReviewerUuid.mockResolvedValue([review])
  repositories.accounts.getByUuids.mockResolvedValue([alice])
  const useCase = new GetMyReviewsUseCase(reviewService, enrichmentService)
  expect(await useCase.execute(alice.uuid)).toEqual([
    { review, reviewerUsername: 'alice', reviewerAvatarUrl: null },
  ])
  expect(repositories.reviews.getAllByReviewerUuid).toHaveBeenCalledExactlyOnceWith(
    alice.uuid,
    100,
    0,
  )
})

test('may be empty', async () => {
  const { reviewService, enrichmentService } = createDomain()
  const useCase = new GetMyReviewsUseCase(reviewService, enrichmentService)
  expect(await useCase.execute(alice.uuid)).toEqual([])
})
