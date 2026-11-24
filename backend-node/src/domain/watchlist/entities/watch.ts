import type { Uuid } from '../../shared/uuid.ts'

export interface Watch {
  id: string | null
  /** The user who is watching */
  watcherUuid: Uuid
  watchedUsername: string
  createdAt: Date
}
