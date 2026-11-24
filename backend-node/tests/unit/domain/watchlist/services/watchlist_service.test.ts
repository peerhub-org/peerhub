import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, test } from 'vitest'
import {
  NotUserTypeException,
  SelfWatchException,
} from '../../../../../src/domain/shared/exceptions.ts'
import { User } from '../../../../../src/domain/users/entities/user.ts'
import { createDomain, makeAccount, makeWatch } from '../../../../helpers/domain.ts'

const alice = makeAccount({ username: 'alice' })

let domain: ReturnType<typeof createDomain>
beforeEach(() => {
  domain = createDomain()
  domain.repositories.accounts.getByUuid.mockResolvedValue(alice)
})

describe('watch', () => {
  test('creates a watch', async () => {
    const watch = await domain.watchlistService.watch(alice.uuid, 'bob')
    expect(watch).toEqual({
      id: null,
      watcherUuid: alice.uuid,
      watchedUsername: 'bob',
      createdAt: expect.any(Date),
    })
    expect(domain.repositories.watchlist.create).toHaveBeenCalledOnce()
  })

  test('returns the existing watch', async () => {
    const existing = makeWatch()
    domain.repositories.watchlist.getByWatcherAndUsername.mockResolvedValue(existing)
    expect(await domain.watchlistService.watch(alice.uuid, 'bob')).toBe(existing)
    expect(domain.repositories.watchlist.create).not.toHaveBeenCalled()
  })

  test('refuses to watch yourself, whatever the case', async () => {
    await expect(domain.watchlistService.watch(alice.uuid, 'Alice')).rejects.toThrow(
      SelfWatchException,
    )
  })

  test('refuses an organization', async () => {
    domain.repositories.users.getByUsername.mockResolvedValue(
      new User({ username: 'some-org', type: 'Organization' }),
    )
    await expect(domain.watchlistService.watch(alice.uuid, 'some-org')).rejects.toThrow(
      NotUserTypeException,
    )
  })

  test('accepts a regular user', async () => {
    domain.repositories.users.getByUsername.mockResolvedValue(
      new User({ username: 'bob', type: 'User' }),
    )
    const watch = await domain.watchlistService.watch(alice.uuid, 'bob')
    expect(watch.watchedUsername).toBe('bob')
    expect(domain.repositories.watchlist.create).toHaveBeenCalledOnce()
  })
})

test('unwatch deletes the watch', async () => {
  await domain.watchlistService.unwatch(alice.uuid, 'bob')
  expect(domain.repositories.watchlist.delete).toHaveBeenCalledExactlyOnceWith(alice.uuid, 'bob')
})

test('lists the watches', async () => {
  const watches = [makeWatch()]
  domain.repositories.watchlist.getAllByWatcher.mockResolvedValue(watches)
  expect(await domain.watchlistService.getWatchlist(alice.uuid)).toBe(watches)
  expect(domain.repositories.watchlist.getAllByWatcher).toHaveBeenCalledExactlyOnceWith(
    alice.uuid,
    100,
    0,
  )
})

test('tells whether a user is watched', async () => {
  expect(await domain.watchlistService.isWatching(randomUUID(), 'nobody')).toBe(false)
  domain.repositories.watchlist.getByWatcherAndUsername.mockResolvedValue(makeWatch())
  expect(await domain.watchlistService.isWatching(alice.uuid, 'bob')).toBe(true)
})
