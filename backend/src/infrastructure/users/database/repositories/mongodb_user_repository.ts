import type { Db } from 'mongodb'
import type { User } from '../../../../domain/users/entities/user.ts'
import type { IUserRepository } from '../../../../domain/users/repositories/user_repository.ts'
import { CASE_INSENSITIVE } from '../../../shared/database/constants.ts'
import { BaseRepository } from '../../../shared/database/repositories/base_repository.ts'
import { userMapper } from '../mappers/user_mapper.ts'
import { USERS, type UserDocument } from '../models/user_model.ts'

export class MongoDBUserRepository
  extends BaseRepository<User, UserDocument>
  implements IUserRepository
{
  constructor(db: Db) {
    super(db.collection<UserDocument>(USERS), userMapper)
  }

  async getByUsername(username: string): Promise<User | null> {
    const document = await this.collection.findOne({ username }, { collation: CASE_INSENSITIVE })
    return document && userMapper.toEntity(document)
  }

  async getByUsernames(usernames: string[]): Promise<User[]> {
    const documents = await this.collection
      .find({ username: { $in: usernames } }, { collation: CASE_INSENSITIVE })
      .toArray()
    return documents.map((document) => userMapper.toEntity(document))
  }
}
