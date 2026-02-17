import { describe, it, expect } from 'vitest'
import accountService from './accountService'

describe('AccountService', () => {
  it('getAccount returns the current account', async () => {
    const account = await accountService.getAccount()
    expect(account.username).toBe('testuser')
  })

  it('deleteAccount completes without error', async () => {
    await expect(accountService.deleteAccount()).resolves.toBeDefined()
  })
})
