import { randomUUID } from 'node:crypto'
import { Binary, ObjectId } from 'mongodb'
import { describe, expect, test } from 'vitest'
import { DuplicateEntityError } from '../../../../src/domain/shared/exceptions.ts'
import { MongoDBAccountRepository } from '../../../../src/infrastructure/accounts/database/repositories/mongodb_account_repository.ts'
import { useDatabase } from '../../../helpers/database.ts'
import { makeAccount, PAST } from '../../../helpers/domain.ts'

const ALICE = 'a0000000-0000-4000-8000-000000000001'
const CAROL = 'a0000000-0000-4000-8000-000000000003'
const LEGACY = 'a0000000-0000-4000-8000-000000000008'

describe('existing documents', () => {
  const db = useDatabase({ withFixtures: true })
  const repository = () => new MongoDBAccountRepository(db())

  test('are found by uuid', async () => {
    expect(await repository().getByUuid(ALICE)).toMatchObject({
      id: '650100000000000000000001',
      uuid: ALICE,
      username: 'alice',
      accessToken: 'gho_alice',
      email: 'alice@example.test',
      createdAt: new Date('2024-01-02T03:04:05.123Z'),
      deletedAt: null,
    })
    expect(await repository().getByUuid(randomUUID())).toBeNull()
  })

  test('are found by username, whatever the case', async () => {
    expect(await repository().getByUsername('cAROLx')).toMatchObject({
      uuid: CAROL,
      username: 'CarolX',
    })
    expect(await repository().getByUsername('carol')).toBeNull()
  })

  test('are found in lists', async () => {
    const byUuid = await repository().getByUuids([ALICE, CAROL, randomUUID()])
    expect(byUuid.map((account) => account.username).sort()).toEqual(['CarolX', 'alice'])
    const byName = await repository().getByUsernames(['ALICE', 'carolx', 'nobody'])
    expect(byName.map((account) => account.uuid).sort()).toEqual([ALICE, CAROL])
    expect(await repository().getByUuids([])).toEqual([])
    expect(await repository().getByUsernames([])).toEqual([])
  })

  test('may lack newer fields', async () => {
    expect(await repository().getByUuid(LEGACY)).toMatchObject({ email: null, deletedAt: null })
  })

  test('keep creation date and unknown fields when updated', async () => {
    await db()
      .collection('accounts')
      .updateOne({ username: 'alice' }, { $set: { extra: 1 } })
    const account = (await repository().getByUuid(ALICE))!
    account.createdAt = new Date()
    account.delete()
    const updated = await repository().update(account)
    expect(updated).toMatchObject({ accessToken: '', deletedAt: account.deletedAt })
    expect(await db().collection('accounts').findOne({ username: 'alice' })).toMatchObject({
      extra: 1,
      access_token: '',
      deleted_at: account.deletedAt,
      created_at: new Date('2024-01-02T03:04:05.123Z'),
    })
  })
})

describe('new documents', () => {
  const db = useDatabase()
  const repository = () => new MongoDBAccountRepository(db())

  test('have the format of the existing ones', async () => {
    const uuid = randomUUID()
    const created = await repository().create(
      makeAccount({ id: null, uuid, username: 'Alice', createdAt: PAST }),
    )
    const stored = await db().collection('accounts').findOne({})
    expect(stored).toEqual({
      _id: new ObjectId(created.id!),
      uuid: expect.any(Binary),
      username: 'Alice',
      access_token: 'test-token',
      email: null,
      deleted_at: null,
      created_at: PAST,
    })
    const binary = stored!.uuid as Binary
    expect(binary.sub_type).toBe(4)
    expect(binary.toString('hex')).toBe(uuid.replaceAll('-', ''))
    expect(await repository().getByUsername('alice')).toEqual(created)
  })

  test('get a creation date', async () => {
    const created = await repository().create(makeAccount({ id: null, createdAt: null }))
    expect(created.createdAt).toBeInstanceOf(Date)
  })

  test('cannot repeat a username', async () => {
    await repository().create(makeAccount({ id: null }))
    await expect(repository().create(makeAccount({ id: null }))).rejects.toThrow(
      DuplicateEntityError,
    )
  })

  test('must exist to be updated', async () => {
    await expect(repository().update(makeAccount({ id: null }))).rejects.toThrow('without an id')
    await expect(
      repository().update(makeAccount({ id: new ObjectId().toHexString() })),
    ).rejects.toThrow('not found')
  })
})
