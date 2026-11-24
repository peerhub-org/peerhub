import type { Binary, ObjectId } from 'mongodb'

export const ACCOUNTS = 'accounts'

/** Optional fields may be missing in documents written by older versions. */
export interface AccountDocument {
  _id: ObjectId
  uuid: Binary
  username: string
  access_token: string
  email?: string | null
  deleted_at?: Date | null
  created_at?: Date
}
