import { ObjectId } from 'mongodb'
import { describe, expect, test } from 'vitest'
import { User } from '../../../../src/domain/users/entities/user.ts'
import { MongoDBUserRepository } from '../../../../src/infrastructure/users/database/repositories/mongodb_user_repository.ts'
import { useDatabase } from '../../../helpers/database.ts'
import { PAST } from '../../../helpers/domain.ts'

const FAR_FUTURE = new Date('2099-01-01T00:00:00.000Z')

describe('existing documents', () => {
  const db = useDatabase({ withFixtures: true })
  const repository = () => new MongoDBUserRepository(db())

  test('are found by username, whatever the case', async () => {
    expect(await repository().getByUsername('CAROLX')).toEqual(
      new User({
        id: '650300000000000000000003',
        username: 'CarolX',
        name: 'CarolX name',
        bio: 'CarolX bio',
        avatarUrl: 'https://avatars.test/carolx.png',
        type: 'User',
        updatedAt: FAR_FUTURE,
      }),
    )
    expect(await repository().getByUsername('nobody')).toBeNull()
  })

  test('are found in lists', async () => {
    const users = await repository().getByUsernames(['ALICE', 'acme', 'nobody'])
    expect(users.map((user) => user.username).sort()).toEqual(['acme', 'alice'])
  })

  test('without date count as updated now', async () => {
    const user = (await repository().getByUsername('legacyuser'))!
    expect(Date.now() - user.updatedAt!.getTime()).toBeLessThan(60_000)
    expect(user).toMatchObject({ name: null, bio: null, avatarUrl: null, type: null })
  })

  test('keep their date when saved without one', async () => {
    const id = '650300000000000000000001'
    const saved = await repository().save(new User({ id, username: 'alice', name: 'New' }))
    expect(saved).toMatchObject({ name: 'New', bio: null, updatedAt: FAR_FUTURE })
    expect(await db().collection('users').findOne({ username: 'alice' })).toEqual({
      _id: new ObjectId(id),
      username: 'alice',
      name: 'New',
      bio: null,
      avatar_url: null,
      type: null,
      updated_at: FAR_FUTURE,
    })
  })

  test('get a new date when saved with one', async () => {
    const id = '650300000000000000000001'
    const saved = await repository().save(new User({ id, username: 'alice', updatedAt: PAST }))
    expect(saved.updatedAt).toEqual(PAST)
  })
})

describe('new documents', () => {
  const db = useDatabase()
  const repository = () => new MongoDBUserRepository(db())

  test('are created by save, without account dates', async () => {
    const user = new User({ username: 'Alice', createdAt: PAST, deletedAt: PAST })
    const saved = await repository().save(user)
    expect(saved.updatedAt).toBeInstanceOf(Date)
    expect(await db().collection('users').findOne({})).toEqual({
      _id: new ObjectId(saved.id!),
      username: 'Alice',
      name: null,
      bio: null,
      avatar_url: null,
      type: null,
      updated_at: saved.updatedAt,
    })
    expect(await repository().getByUsername('alice')).toEqual(saved)
  })
})
