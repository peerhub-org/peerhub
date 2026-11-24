import { randomUUID } from 'node:crypto'
import { expect, test, vi } from 'vitest'
import { SearchUsersUseCase } from '../../../../src/application/github/use_cases/search_users.ts'
import { AccountNotFoundException } from '../../../../src/domain/shared/exceptions.ts'
import { createDomain, makeAccount } from '../../../helpers/domain.ts'

test('searches with the token of the account', async () => {
  const { accountService, repositories } = createDomain()
  const found = [{ login: 'alice', avatarUrl: 'https://example.com/a.png', type: 'User' }]
  const searchUsers = vi.fn(async () => found)
  const useCase = new SearchUsersUseCase(accountService, { searchUsers })

  await expect(useCase.execute('ali', randomUUID())).rejects.toThrow(AccountNotFoundException)

  const me = makeAccount({ accessToken: 'gho_me' })
  repositories.accounts.getByUuid.mockResolvedValue(me)
  expect(await useCase.execute('ali', me.uuid)).toBe(found)
  expect(searchUsers).toHaveBeenCalledExactlyOnceWith('ali', 'gho_me')
})
