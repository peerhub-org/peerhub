import { once } from 'node:events'
import { createServer, type AddressInfo, type Socket } from 'node:net'
import { MongoClient } from 'mongodb'
import { expect, test } from 'vitest'
import {
  connectDatabase,
  initDatabase,
  pingDatabase,
} from '../../../../../src/infrastructure/shared/database/connection.ts'
import { useDatabase } from '../../../../helpers/database.ts'

const db = useDatabase()

// The names are the ones of the existing production database.
const EXPECTED: Record<string, string[]> = {
  accounts: ['_id_', 'uuid_1 unique', 'username_1 unique'],
  reviews: [
    '_id_',
    'reviewer_uuid_1',
    'reviewed_username_1',
    'reviewer_uuid_1_reviewed_username_1 unique',
    'reviewed_username_1_created_at_-1',
  ],
  users: ['_id_', 'username_1 unique'],
  watchlist: [
    '_id_',
    'watcher_uuid_1',
    'watched_username_1',
    'watcher_uuid_1_watched_username_1 unique',
  ],
}

test.each(Object.keys(EXPECTED))('%s has its indexes', async (name) => {
  const indexes = await db().collection(name).listIndexes().toArray()
  const names = indexes.map((index) => `${index.name}${index.unique ? ' unique' : ''}`)
  expect(names.sort()).toEqual(EXPECTED[name]!.toSorted())
})

test('accepts a database where the indexes already exist', async () => {
  await expect(initDatabase(db())).resolves.toBeUndefined()
})

test('fails when the server cannot be reached', async () => {
  await expect(
    connectDatabase({
      MONGO_URI: 'mongodb://127.0.0.1:1/?serverSelectionTimeoutMS=200',
      MONGO_DB: 'x',
    }),
  ).rejects.toThrow()
})

test('ping answers', async () => {
  await expect(pingDatabase(db())).resolves.toBeUndefined()
})

test('ping gives up on a server that does not answer', async () => {
  // Accepts connections and stays silent, like a frozen server
  const sockets = new Set<Socket>()
  const silent = createServer((socket) => void sockets.add(socket)).listen(0, '127.0.0.1')
  await once(silent, 'listening')
  const client = new MongoClient(
    `mongodb://127.0.0.1:${(silent.address() as AddressInfo).port}/?directConnection=true`,
  )
  const start = Date.now()
  try {
    await expect(pingDatabase(client.db('x'))).rejects.toThrow()
    expect(Date.now() - start).toBeLessThan(4000)
  } finally {
    await client.close()
    for (const socket of sockets) socket.destroy()
    silent.close()
  }
})
