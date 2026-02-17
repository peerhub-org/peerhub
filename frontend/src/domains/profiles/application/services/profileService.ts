import axios from 'axios'
import { User, UserSearchResult } from '@domains/profiles/application/interfaces/User'
import { API_BASE_URL } from '@shared/application/config/env'
import { z } from 'zod'

const userSchema = z.object({
  username: z.string(),
  name: z.string().nullable(),
  bio: z.string().nullable(),
  avatar_url: z.string().nullable(),
  type: z.string().nullable(),
  created_at: z.string().nullable(),
  deleted_at: z.string().nullable(),
})

const userSearchResultSchema = z.object({
  login: z.string(),
  avatar_url: z.string(),
  type: z.string().nullable(),
})

const userSearchResponseSchema = z.object({
  users: z.array(userSearchResultSchema),
})

class ProfileService {
  async getUser(username: string): Promise<User> {
    const response = await axios.get(API_BASE_URL + `users/${username}`)
    return userSchema.parse(response.data)
  }

  async refreshUser(username: string): Promise<User> {
    const response = await axios.post(API_BASE_URL + `users/${username}/refresh`)
    return userSchema.parse(response.data)
  }

  async searchUsers(query: string): Promise<UserSearchResult[]> {
    const response = await axios.get(API_BASE_URL + `users/search`, {
      params: { q: query },
    })
    return userSearchResponseSchema.parse(response.data).users
  }
}

export default new ProfileService()
