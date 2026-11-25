import { expect, test } from 'vitest'
import { GetCurrentAccountUseCase } from '../../../../src/application/accounts/use_cases/get_current_account.ts'
import { AccountNotFoundException } from '../../../../src/domain/shared/exceptions.ts'
import { createDomain, makeAccount, PAST } from '../../../helpers/domain.ts'

test('returns active accounts only', async () => {
  const { accountService, repositories } = createDomain()
  const useCase = new GetCurrentAccountUseCase(accountService)
  const account = makeAccount()
  repositories.accounts.getByUuid.mockResolvedValue(account)
  expect(await useCase.execute(account.uuid)).toBe(account)
  repositories.accounts.getByUuid.mockResolvedValue(makeAccount({ deletedAt: PAST }))
  await expect(useCase.execute(account.uuid)).rejects.toThrow(AccountNotFoundException)
})
