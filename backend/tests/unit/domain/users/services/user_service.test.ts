import { beforeEach, describe, expect, test } from 'vitest'
import { User } from '../../../../../src/domain/users/entities/user.ts'
import { createDomain } from '../../../../helpers/domain.ts'

const DAY_MS = 24 * 60 * 60 * 1000

let domain: ReturnType<typeof createDomain>
beforeEach(() => void (domain = createDomain()))

test('gets a user by username', async () => {
  const user = new User({ username: 'testuser' })
  domain.repositories.users.getByUsername.mockResolvedValue(user)
  expect(await domain.userService.getUserByUsername('testuser')).toBe(user)
  expect(domain.repositories.users.getByUsername).toHaveBeenCalledExactlyOnceWith('testuser')
})

test('keys users by lowercase username', async () => {
  const user = new User({ username: 'CarolX' })
  domain.repositories.users.getByUsernames.mockResolvedValue([user])
  expect(await domain.userService.getUsersByUsernames(['CarolX'])).toEqual(
    new Map([['carolx', user]]),
  )
})

test('saves a user', async () => {
  const user = new User({ username: 'testuser' })
  expect(await domain.userService.saveUser(user)).toBe(user)
  expect(domain.repositories.users.save).toHaveBeenCalledExactlyOnceWith(user)
})

describe('cache', () => {
  test.each([
    ['never updated', null, true],
    ['8 days old', 8, true],
    ['1 day old', 1, false],
  ])('%s', (_, days, expired) => {
    const updatedAt = days === null ? null : new Date(Date.now() - days * DAY_MS)
    const user = new User({ username: 'alice', updatedAt })
    expect(domain.userService.isCacheExpired(user)).toBe(expired)
  })
})

test.each([
  ['User', true],
  ['Organization', false],
  ['Bot', false],
  [null, false],
])('type %s is a regular user: %s', (type, expected) => {
  expect(new User({ username: 'x', type }).isUserType).toBe(expected)
})
