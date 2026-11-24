import { Account } from '../../../../domain/accounts/entities/account.ts'
import {
  uuidFromBson,
  uuidToBson,
  type Mapper,
} from '../../../shared/database/mappers/base_mapper.ts'
import type { AccountDocument } from '../models/account_model.ts'

export const accountMapper: Mapper<Account, AccountDocument> = {
  toEntity: (document) =>
    new Account({
      id: document._id.toHexString(),
      uuid: uuidFromBson(document.uuid),
      username: document.username,
      accessToken: document.access_token,
      email: document.email,
      deletedAt: document.deleted_at,
      createdAt: document.created_at ?? new Date(),
    }),

  toFields: (entity, current) => ({
    uuid: uuidToBson(entity.uuid),
    username: entity.username,
    access_token: entity.accessToken,
    email: entity.email,
    deleted_at: entity.deletedAt,
    // Never changes once the account exists.
    created_at: current?.created_at ?? entity.createdAt ?? new Date(),
  }),
}
