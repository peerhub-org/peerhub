import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, test } from 'vitest'
import { AccountNotFoundException } from '../../../../../src/domain/shared/exceptions.ts'
import { createDomain, makeAccount, PAST } from '../../../../helpers/domain.ts'

let domain: ReturnType<typeof createDomain>
beforeEach(() => void (domain = createDomain()))

test('gets an account by uuid', async () => {
  const account = makeAccount()
  domain.repositories.accounts.getByUuid.mockResolvedValue(account)
  expect(await domain.accountService.getAccountByUuid(account.uuid)).toBe(account)
  expect(domain.repositories.accounts.getByUuid).toHaveBeenCalledExactlyOnceWith(account.uuid)
})

test('fails for an unknown uuid', async () => {
  await expect(domain.accountService.getAccountByUuid(randomUUID())).rejects.toThrow(
    AccountNotFoundException,
  )
})

test('a deleted account is found, but is not active', async () => {
  const account = makeAccount({ deletedAt: PAST })
  domain.repositories.accounts.getByUuid.mockResolvedValue(account)
  expect(await domain.accountService.getAccountByUuid(account.uuid)).toBe(account)
  await expect(domain.accountService.getActiveAccountByUuid(account.uuid)).rejects.toThrow(
    AccountNotFoundException,
  )
})

test('keys accounts by uuid and by lowercase username', async () => {
  const account = makeAccount({ username: 'CarolX' })
  domain.repositories.accounts.getByUuids.mockResolvedValue([account])
  domain.repositories.accounts.getByUsernames.mockResolvedValue([account])
  expect(await domain.accountService.getAccountsByUuids([account.uuid])).toEqual(
    new Map([[account.uuid, account]]),
  )
  expect(await domain.accountService.getAccountsByUsernames(['carolx'])).toEqual(
    new Map([['carolx', account]]),
  )
})

test('deletes an account', async () => {
  const account = makeAccount()
  await domain.accountService.deleteAccount(account)
  expect(account.deletedAt).not.toBeNull()
  expect(account.accessToken).toBe('')
  expect(domain.repositories.accounts.update).toHaveBeenCalledExactlyOnceWith(account)
})

describe('getOrCreateAccount', () => {
  test('refreshes token and email of an existing account', async () => {
    const existing = makeAccount({ email: 'old@example.test' })
    domain.repositories.accounts.getByUsername.mockResolvedValue(existing)
    const result = await domain.accountService.getOrCreateAccount('testuser', 'new-token', 'new@x')
    expect(result).toEqual({ account: existing, isNew: false })
    expect(existing).toMatchObject({ accessToken: 'new-token', email: 'new@x' })
    expect(domain.repositories.accounts.update).toHaveBeenCalledOnce()
  })

  test('keeps the known email when none is given', async () => {
    const existing = makeAccount({ email: 'old@example.test' })
    domain.repositories.accounts.getByUsername.mockResolvedValue(existing)
    await domain.accountService.getOrCreateAccount('testuser', 'new-token')
    expect(existing.email).toBe('old@example.test')
  })

  test('reactivates a deleted account', async () => {
    const existing = makeAccount({ deletedAt: PAST, accessToken: '' })
    domain.repositories.accounts.getByUsername.mockResolvedValue(existing)
    await domain.accountService.getOrCreateAccount('testuser', 'new-token')
    expect(existing).toMatchObject({ deletedAt: null, accessToken: 'new-token' })
  })

  test('writes nothing when nothing changed', async () => {
    const existing = makeAccount()
    domain.repositories.accounts.getByUsername.mockResolvedValue(existing)
    const result = await domain.accountService.getOrCreateAccount('testuser', '')
    expect(result).toEqual({ account: existing, isNew: false })
    expect(domain.repositories.accounts.update).not.toHaveBeenCalled()
  })

  test('creates a new account', async () => {
    const { account, isNew } = await domain.accountService.getOrCreateAccount('newuser', 'token')
    expect(isNew).toBe(true)
    expect(account).toMatchObject({
      id: null,
      username: 'newuser',
      accessToken: 'token',
      email: null,
      deletedAt: null,
    })
    expect(account.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-/)
    expect(domain.repositories.accounts.create).toHaveBeenCalledOnce()
  })
})
