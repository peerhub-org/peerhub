import type { ObjectId } from 'mongodb'

export const USERS = 'users'

/** Optional fields may be missing in documents written by older versions. */
export interface UserDocument {
  _id: ObjectId
  username: string
  name?: string | null
  bio?: string | null
  avatar_url?: string | null
  type?: string | null
  updated_at?: Date
}
