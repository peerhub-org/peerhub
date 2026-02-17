import axios from 'axios'
import { Watch, WatchStatus } from '../interfaces/Watch'
import { API_BASE_URL } from '@shared/application/config/env'
import { z } from 'zod'

const watchSchema = z.object({
  id: z.string(),
  watched_username: z.string(),
  watched_avatar_url: z.string().nullable(),
  watched_name: z.string().nullable(),
  created_at: z.string(),
})

const watchStatusSchema = z.object({
  is_watching: z.boolean(),
})

class WatchlistService {
  async watch(username: string): Promise<void> {
    await axios.post(API_BASE_URL + 'watchlist', { username })
  }

  async unwatch(username: string): Promise<void> {
    await axios.delete(API_BASE_URL + `watchlist/${username}`)
  }

  async getWatchlist(limit = 100, offset = 0): Promise<Watch[]> {
    const response = await axios.get(API_BASE_URL + 'watchlist', {
      params: { limit, offset },
    })
    return z.array(watchSchema).parse(response.data)
  }

  async checkWatch(username: string): Promise<boolean> {
    const response = await axios.get<WatchStatus>(API_BASE_URL + `watchlist/check/${username}`)
    return watchStatusSchema.parse(response.data).is_watching
  }
}

export default new WatchlistService()
