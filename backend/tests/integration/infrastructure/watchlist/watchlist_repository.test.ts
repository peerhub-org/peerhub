import { randomUUID } from 'node:crypto'
import { Binary, ObjectId } from 'mongodb'
import { describe, expect, test } from 'vitest'
import { MongoDBWatchlistRepository } from '../../../../src/infrastructure/watchlist/database/repositories/mongodb_watchlist_repository.ts'
import { useDatabase } from '../../../helpers/database.ts'
import { makeWatch, PAST } from '../../../helpers/domain.ts'

const ALICE = 'a0000000-0000-4000-8000-000000000001'

describe('documents written by the Python backend', () => {
  const db = useDatabase({ withFixtures: true })
  const repository = () => new MongoDBWatchlistRepository(db())
  const list = async (limit = 100, offset = 0) =>
    (await repository().getAllByWatcher(ALICE, limit, offset)).map((w) => w.watchedUsername)

  test('are found, whatever the case', async () => {
    expect(await repository().getByWatcherAndUsername(ALICE, 'BOB')).toEqual({
      id: '650400000000000000000001',
      watcherUuid: ALICE,
      watchedUsername: 'bob',
      createdAt: new Date('2024-01-31T03:04:05.123Z'),
    })
    expect(await repository().getByWatcherAndUsername(randomUUID(), 'bob')).toBeNull()
  })

  test('are listed newest first', async () => {
    expect(await list()).toEqual(['neverseenprofile', 'dave', 'bob'])
    expect(await list(1, 1)).toEqual(['dave'])
  })

  test('are deleted one by one, whatever the case, or by watcher', async () => {
    await repository().delete(ALICE, 'BOB')
    await repository().delete(ALICE, 'nobody')
    expect(await list()).toEqual(['neverseenprofile', 'dave'])
    expect(await repository().deleteAllByWatcher(ALICE)).toBe(2)
    expect(await list()).toEqual([])
    expect(await db().collection('watchlist').countDocuments()).toBe(3)
  })
})

describe('new documents', () => {
  const db = useDatabase()

  test('have the format of the Python backend', async () => {
    const repository = new MongoDBWatchlistRepository(db())
    const created = await repository.create(makeWatch({ id: null }))
    const stored = await db().collection('watchlist').findOne({})
    expect(stored).toEqual({
      _id: new ObjectId(created.id!),
      watcher_uuid: expect.any(Binary),
      watched_username: 'bob',
      created_at: PAST,
    })
    expect((stored!.watcher_uuid as Binary).sub_type).toBe(4)
    expect(await repository.getByWatcherAndUsername(created.watcherUuid, 'bob')).toEqual(created)
  })
})
