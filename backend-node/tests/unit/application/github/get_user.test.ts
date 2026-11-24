import { randomUUID } from 'node:crypto'
import { expect, test, vi } from 'vitest'
import { GetUserUseCase } from '../../../../src/application/github/use_cases/get_user.ts'
import { AccountNotFoundException } from '../../../../src/domain/shared/exceptions.ts'
import { User } from '../../../../src/domain/users/entities/user.ts'
import { createDomain, makeAccount, PAST } from '../../../helpers/domain.ts'

const me = makeAccount({ username: 'me', accessToken: 'gho_me' })

function setup(type = 'User') {
  const domain = createDomain()
  const fetchUserByUsername = vi.fn(async () => ({
    username: 'Alice',
    name: 'Alice',
    bio: null,
    avatarUrl: 'https://example.com/alice.png',
    type,
  }))
  domain.repositories.accounts.getByUuid.mockResolvedValue(me)
  const useCase = new GetUserUseCase(domain.accountService, domain.userService, {
    fetchUserByUsername,
  })
  return { ...domain, useCase, fetchUserByUsername }
}

const cached = (updatedAt: Date) =>
  new User({ id: 'u1', username: 'alice', name: 'Old', type: 'User', updatedAt })

test.each(['User', 'Organization'])('fetches and stores an unknown %s', async (type) => {
  const { useCase, repositories, fetchUserByUsername } = setup(type)
  const user = await useCase.execute('alice', me.uuid)
  expect(fetchUserByUsername).toHaveBeenCalledExactlyOnceWith('alice', 'gho_me')
  expect(user).toMatchObject({ id: null, username: 'Alice', type, updatedAt: expect.any(Date) })
  expect(repositories.users.save).toHaveBeenCalledExactlyOnceWith(user)
})

test('uses a fresh cache, with the dates of the account', async () => {
  const { useCase, repositories, fetchUserByUsername } = setup()
  repositories.users.getByUsername.mockResolvedValue(cached(new Date()))
  repositories.accounts.getByUsername.mockResolvedValue(
    makeAccount({ createdAt: PAST, deletedAt: PAST }),
  )
  expect(await useCase.execute('alice', me.uuid)).toMatchObject({
    name: 'Old',
    createdAt: PAST,
    deletedAt: PAST,
  })
  expect(fetchUserByUsername).not.toHaveBeenCalled()
  expect(repositories.users.save).not.toHaveBeenCalled()
})

test('a cached user may have no account', async () => {
  const { useCase, repositories } = setup()
  repositories.users.getByUsername.mockResolvedValue(cached(new Date()))
  expect(await useCase.execute('alice', me.uuid)).toMatchObject({
    createdAt: null,
    deletedAt: null,
  })
})

test.each([
  ['an expired cache', PAST, false],
  ['a forced refresh', new Date(), true],
])('renews the same document on %s', async (_, updatedAt, force) => {
  const { useCase, repositories } = setup()
  repositories.users.getByUsername.mockResolvedValue(cached(updatedAt))
  repositories.accounts.getByUsername.mockResolvedValue(makeAccount({ createdAt: PAST }))
  // Stored users carry no account dates.
  repositories.users.save.mockImplementation(
    async (user) => new User({ ...user, createdAt: null, deletedAt: null }),
  )
  const user = await useCase.execute('alice', me.uuid, force)
  expect(user).toMatchObject({ id: 'u1', name: 'Alice', createdAt: PAST, deletedAt: null })
  expect(Date.now() - user.updatedAt!.getTime()).toBeLessThan(60_000)
})

test('needs an account to ask GitHub', async () => {
  const { useCase, repositories, fetchUserByUsername } = setup()
  repositories.accounts.getByUuid.mockResolvedValue(null)
  await expect(useCase.execute('alice', randomUUID())).rejects.toThrow(AccountNotFoundException)
  expect(fetchUserByUsername).not.toHaveBeenCalled()
})
