import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { BSON, type Db, type Document } from 'mongodb'
import { afterAll, beforeAll, beforeEach, inject } from 'vitest'
import {
  connectDatabase,
  type Database,
} from '../../src/infrastructure/shared/database/connection.ts'

interface Fixtures {
  review_ids: Record<string, string>
  collections: Record<string, Document[]>
}

/** Documents written by the Python backend. Dates and UUIDs become BSON values. */
export const fixtures = BSON.EJSON.parse(
  readFileSync(new URL('../../contract/reference/fixtures.json', import.meta.url), 'utf8'),
) as Fixtures

/** A database of its own for the test file, emptied (or refilled) before each test. */
export function useDatabase(options: { withFixtures?: boolean } = {}): () => Db {
  let database: Database
  beforeAll(async () => {
    database = await connectDatabase({
      MONGO_URI: inject('mongoUri'),
      MONGO_DB: `test_${randomUUID().slice(0, 8)}`,
    })
  })
  beforeEach(async () => {
    for (const [name, documents] of Object.entries(fixtures.collections)) {
      await database.db.collection(name).deleteMany({})
      if (options.withFixtures) await database.db.collection(name).insertMany(documents)
    }
  })
  afterAll(async () => {
    await database.db.dropDatabase()
    await database.close()
  })
  return () => database.db
}
