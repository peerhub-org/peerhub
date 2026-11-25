import type { Db } from 'mongodb'
import type { Account } from '../../../../domain/accounts/entities/account.ts'
import type { IAccountRepository } from '../../../../domain/accounts/repositories/account_repository.ts'
import type { Uuid } from '../../../../domain/shared/uuid.ts'
import { CASE_INSENSITIVE } from '../../../shared/database/constants.ts'
import { uuidToBson } from '../../../shared/database/mappers/base_mapper.ts'
import { BaseRepository } from '../../../shared/database/repositories/base_repository.ts'
import { accountMapper } from '../mappers/account_mapper.ts'
import { ACCOUNTS, type AccountDocument } from '../models/account_model.ts'

export class MongoDBAccountRepository
  extends BaseRepository<Account, AccountDocument>
  implements IAccountRepository
{
  constructor(db: Db) {
    super(db.collection<AccountDocument>(ACCOUNTS), accountMapper)
  }

  async getByUsername(username: string): Promise<Account | null> {
    const document = await this.collection.findOne({ username }, { collation: CASE_INSENSITIVE })
    return document && accountMapper.toEntity(document)
  }

  async getByUuid(uuid: Uuid): Promise<Account | null> {
    const document = await this.collection.findOne({ uuid: uuidToBson(uuid) })
    return document && accountMapper.toEntity(document)
  }

  async getByUuids(uuids: Uuid[]): Promise<Account[]> {
    const documents = await this.collection
      .find({ uuid: { $in: uuids.map((uuid) => uuidToBson(uuid)) } })
      .toArray()
    return documents.map((document) => accountMapper.toEntity(document))
  }

  async getByUsernames(usernames: string[]): Promise<Account[]> {
    const documents = await this.collection
      .find({ username: { $in: usernames } }, { collation: CASE_INSENSITIVE })
      .toArray()
    return documents.map((document) => accountMapper.toEntity(document))
  }
}
