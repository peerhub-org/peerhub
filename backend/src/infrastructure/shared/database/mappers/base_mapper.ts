import { Binary, UUID, type ObjectId } from 'mongodb'
import type { Uuid } from '../../../../domain/shared/uuid.ts'

export interface Mapper<TEntity, TDocument extends { _id: ObjectId }> {
  toEntity(document: TDocument): TEntity
  /** Fields to write. On updates, `current` is the stored document. */
  toFields(entity: TEntity, current?: TDocument): Omit<TDocument, '_id'>
}

/** UUIDs are stored as Binary subtype 4, never as text. */
export function uuidToBson(uuid: Uuid): UUID {
  return new UUID(uuid)
}

export function uuidFromBson(value: Binary): Uuid {
  return new UUID(value.value()).toHexString()
}
