export interface User {
  username: string
  name: string | null
  bio: string | null
  avatar_url: string | null
  type: string | null
  created_at: string | null
  deleted_at: string | null
}

export interface UserSearchResult {
  login: string
  avatar_url: string
  type: string | null
}
