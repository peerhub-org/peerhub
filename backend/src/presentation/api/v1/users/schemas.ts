import { z } from 'zod'
import type { User } from '../../../../domain/users/entities/user.ts'
import type { GitHubSearchedUser } from '../../../../infrastructure/github/external/github_client.ts'
import { dateTime, toOptionalDateTime } from '../shared/schemas.ts'

export const exchangeCodeRequest = z
  .object({ code: z.string() })
  .meta({ id: 'ExchangeCodeRequest' })

export const searchUsersQuery = z.object({ q: z.string() })

export const oauthUrlResponse = z.object({ url: z.string() }).meta({ id: 'OAuthUrlResponse' })

export const tokenResponse = z.object({ token: z.string() }).meta({ id: 'TokenResponse' })

export const userResponse = z
  .object({
    username: z.string(),
    name: z.string().nullable(),
    bio: z.string().nullable(),
    avatar_url: z.string().nullable(),
    type: z.string().nullable(),
    created_at: dateTime.nullable(),
    deleted_at: dateTime.nullable(),
  })
  .meta({ id: 'UserResponse' })

export function toUserResponse(user: User): z.output<typeof userResponse> {
  return {
    username: user.username,
    name: user.name,
    bio: user.bio,
    avatar_url: user.avatarUrl,
    type: user.type,
    created_at: toOptionalDateTime(user.createdAt),
    deleted_at: toOptionalDateTime(user.deletedAt),
  }
}

const userSearchItem = z
  .object({
    login: z.string(),
    avatar_url: z.string(),
    type: z.string().nullable(),
  })
  .meta({ id: 'UserSearchItem' })

export const userSearchResponse = z
  .object({ users: z.array(userSearchItem) })
  .meta({ id: 'UserSearchResponse' })

export function toUserSearchResponse(
  users: GitHubSearchedUser[],
): z.output<typeof userSearchResponse> {
  return {
    users: users.map((user) => ({
      login: user.login,
      avatar_url: user.avatarUrl,
      type: user.type,
    })),
  }
}
