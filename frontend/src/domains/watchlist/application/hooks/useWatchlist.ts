import { useEffect, useState } from 'react'
import watchlistService from '@domains/watchlist/application/services/watchlistService'
import { Watch } from '@domains/watchlist/application/interfaces/Watch'

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Watch[]>([])
  const [watchlistLoading, setWatchlistLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isActive = true

    watchlistService
      .getWatchlist()
      .then((watchlist) => {
        if (isActive) {
          setWatchlist(watchlist)
          setError(null)
        }
      })
      .catch((err) => {
        if (isActive) {
          setWatchlist([])
          setError(err instanceof Error ? err : new Error('Failed to load watchlist'))
        }
      })
      .finally(() => {
        if (isActive) {
          setWatchlistLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  return { watchlist, watchlistLoading, error }
}
