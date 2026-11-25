import { beforeEach, expect, test } from 'vitest'
import { CheckWatchUseCase } from '../../../../src/application/watchlist/use_cases/check_watch.ts'
import { GetWatchlistUseCase } from '../../../../src/application/watchlist/use_cases/get_watchlist.ts'
import { UnwatchUseCase } from '../../../../src/application/watchlist/use_cases/unwatch.ts'
import { WatchUseCase } from '../../../../src/application/watchlist/use_cases/watch.ts'
import { User } from '../../../../src/domain/users/entities/user.ts'
import { createDomain, makeAccount, makeWatch } from '../../../helpers/domain.ts'

const me = makeAccount({ username: 'me' })

let domain: ReturnType<typeof createDomain>
beforeEach(() => {
  domain = createDomain()
  domain.repositories.accounts.getByUuid.mockResolvedValue(me)
})

test('watch', async () => {
  const watch = await new WatchUseCase(domain.watchlistService).execute(me.uuid, 'bob')
  expect(watch).toMatchObject({ watcherUuid: me.uuid, watchedUsername: 'bob' })
})

test('unwatch', async () => {
  await new UnwatchUseCase(domain.watchlistService).execute(me.uuid, 'bob')
  expect(domain.repositories.watchlist.delete).toHaveBeenCalledExactlyOnceWith(me.uuid, 'bob')
})

test('check', async () => {
  const useCase = new CheckWatchUseCase(domain.watchlistService)
  expect(await useCase.execute(me.uuid, 'bob')).toBe(false)
  domain.repositories.watchlist.getByWatcherAndUsername.mockResolvedValue(makeWatch())
  expect(await useCase.execute(me.uuid, 'bob')).toBe(true)
})

test('list keeps the order and accepts unknown profiles', async () => {
  const watches = ['bob', 'unknown', 'alice'].map((name) => makeWatch({ watchedUsername: name }))
  domain.repositories.watchlist.getAllByWatcher.mockResolvedValue(watches)
  domain.repositories.users.getByUsername.mockImplementation(async (username) =>
    username === 'unknown' ? null : new User({ username }),
  )
  const useCase = new GetWatchlistUseCase(domain.watchlistService, domain.userService)
  expect(await useCase.execute(me.uuid, 10, 5)).toEqual([
    { watch: watches[0], user: new User({ username: 'bob' }) },
    { watch: watches[1], user: null },
    { watch: watches[2], user: new User({ username: 'alice' }) },
  ])
  expect(domain.repositories.watchlist.getAllByWatcher).toHaveBeenCalledExactlyOnceWith(
    me.uuid,
    10,
    5,
  )
})

test('list may be empty', async () => {
  const useCase = new GetWatchlistUseCase(domain.watchlistService, domain.userService)
  expect(await useCase.execute(me.uuid, 10, 0)).toEqual([])
})
