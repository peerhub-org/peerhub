import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import {
  connectDatabase,
  initDatabase,
} from '../../../../../src/infrastructure/shared/database/connection.ts'
import { useDatabase } from '../../../../helpers/database.ts'

const db = useDatabase()

type Index = { name: string; key: Record<string, number>; unique: boolean }
const expected = JSON.parse(
  readFileSync(new URL('../../../../../contract/reference/indexes.json', import.meta.url), 'utf8'),
) as Record<string, Index[]>

const byName = (a: Index, b: Index) => a.name.localeCompare(b.name)

test.each(Object.keys(expected))('%s has the indexes of the Python backend', async (name) => {
  const indexes = await db().collection(name).listIndexes().toArray()
  const actual = indexes.map(
    (index): Index => ({
      name: index.name as string,
      key: index.key as Record<string, number>,
      unique: (index.unique as boolean | undefined) ?? false,
    }),
  )
  expect(actual.sort(byName)).toEqual(expected[name]!.toSorted(byName))
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
