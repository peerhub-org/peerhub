import { expect, test } from 'vitest'
import { makeAccount, PAST } from '../../../../helpers/domain.ts'

test('delete marks the account and clears its token', () => {
  const account = makeAccount()
  account.delete()
  expect(account.deletedAt).toBeInstanceOf(Date)
  expect(account.accessToken).toBe('')
})

test('activate removes the deletion mark', () => {
  const account = makeAccount({ deletedAt: PAST })
  account.activate()
  expect(account.deletedAt).toBeNull()
})
