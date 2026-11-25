import { User } from '../../../../domain/users/entities/user.ts'
import type { Mapper } from '../../../shared/database/mappers/base_mapper.ts'
import type { UserDocument } from '../models/user_model.ts'

export const userMapper: Mapper<User, UserDocument> = {
  toEntity: (document) =>
    new User({
      id: document._id.toHexString(),
      username: document.username,
      name: document.name,
      bio: document.bio,
      avatarUrl: document.avatar_url,
      type: document.type,
      updatedAt: document.updated_at ?? new Date(),
    }),

  toFields: (entity, current) => ({
    username: entity.username,
    name: entity.name,
    bio: entity.bio,
    avatar_url: entity.avatarUrl,
    type: entity.type,
    // Signing in saves the profile without a date, which keeps the cache age.
    updated_at: entity.updatedAt ?? current?.updated_at ?? new Date(),
  }),
}
