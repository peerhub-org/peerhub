export interface Watch {
  id: string
  watched_username: string
  watched_avatar_url: string | null
  watched_name: string | null
  created_at: string
}

export interface WatchStatus {
  is_watching: boolean
}
