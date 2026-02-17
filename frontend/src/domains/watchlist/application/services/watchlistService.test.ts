import { describe, it, expect } from 'vitest'
import watchlistService from './watchlistService'

describe('WatchlistService', () => {
  it('watch completes without error', async () => {
    await expect(watchlistService.watch('johndoe')).resolves.toBeUndefined()
  })

  it('unwatch completes without error', async () => {
    await expect(watchlistService.unwatch('johndoe')).resolves.toBeUndefined()
  })

  it('getWatchlist returns watch list', async () => {
    const watchlist = await watchlistService.getWatchlist()
    expect(watchlist).toHaveLength(1)
    expect(watchlist[0].watched_username).toBe('user1')
  })

  it('checkWatch returns watch status', async () => {
    const isWatched = await watchlistService.checkWatch('johndoe')
    expect(isWatched).toBe(false)
  })
})
