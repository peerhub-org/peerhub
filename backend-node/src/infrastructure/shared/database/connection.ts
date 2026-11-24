import { MongoClient, type Db, type IndexDescription } from 'mongodb'
import type { Settings } from '../config/config.ts'

// Same names and keys the Python backend creates, so that nothing is rebuilt on existing data.
const INDEXES: Record<string, IndexDescription[]> = {
  accounts: [
    { key: { uuid: 1 }, unique: true },
    { key: { username: 1 }, unique: true },
  ],
  reviews: [
    { key: { reviewer_uuid: 1 } },
    { key: { reviewed_username: 1 } },
    { key: { reviewer_uuid: 1, reviewed_username: 1 }, unique: true },
    { key: { reviewed_username: 1, created_at: -1 } },
  ],
  users: [{ key: { username: 1 }, unique: true }],
  watchlist: [
    { key: { watcher_uuid: 1 } },
    { key: { watched_username: 1 } },
    { key: { watcher_uuid: 1, watched_username: 1 }, unique: true },
  ],
}

export async function initDatabase(db: Db): Promise<void> {
  for (const [name, indexes] of Object.entries(INDEXES))
    await db.collection(name).createIndexes(indexes)
}

export interface Database {
  db: Db
  close(): Promise<void>
}

/** Connect and make sure the indexes exist. Fails when the server cannot be reached. */
export async function connectDatabase(
  settings: Pick<Settings, 'MONGO_URI' | 'MONGO_DB'>,
): Promise<Database> {
  const client = new MongoClient(settings.MONGO_URI)
  try {
    const db = client.db(settings.MONGO_DB)
    await initDatabase(db)
    return { db, close: () => client.close() }
  } catch (error) {
    await client.close()
    throw error
  }
}
