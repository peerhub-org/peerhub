import { randomUUID } from 'node:crypto'
import { expect, test } from 'vitest'
import { DeleteAccountUseCase } from '../../../../src/application/accounts/use_cases/delete_account.ts'
import { AccountNotFoundException } from '../../../../src/domain/shared/exceptions.ts'
import { createDomain, makeAccount } from '../../../helpers/domain.ts'

const setup = () => {
  const domain = createDomain()
  return {
    ...domain,
    useCase: new DeleteAccountUseCase(
      domain.accountService,
      domain.reviewService,
      domain.watchlistService,
    ),
  }
}

test('deletes the account, its reviews and its watchlist', async () => {
  const { useCase, repositories } = setup()
  const account = makeAccount()
  repositories.accounts.getByUuid.mockResolvedValue(account)

  const result = await useCase.execute(account.uuid)

  expect(result.deletedAt).toBeInstanceOf(Date)
  expect(result.accessToken).toBe('')
  expect(repositories.reviews.deleteAllByReviewerUuid).toHaveBeenCalledExactlyOnceWith(account.uuid)
  expect(repositories.watchlist.deleteAllByWatcher).toHaveBeenCalledExactlyOnceWith(account.uuid)
  expect(repositories.accounts.update).toHaveBeenCalledExactlyOnceWith(account)
})

test('deletes nothing for an unknown account', async () => {
  const { useCase, repositories } = setup()
  await expect(useCase.execute(randomUUID())).rejects.toThrow(AccountNotFoundException)
  expect(repositories.reviews.deleteAllByReviewerUuid).not.toHaveBeenCalled()
  expect(repositories.watchlist.deleteAllByWatcher).not.toHaveBeenCalled()
})
