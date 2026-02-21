import { useQuery } from '@tanstack/react-query'
import watchlistService from '@domains/watchlist/application/services/watchlistService'
import { queryKeys } from '@shared/application/queryKeys'

export function useWatchlist() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.watchlist.list(),
    queryFn: () => watchlistService.getWatchlist(),
  })

  return {
    watchlist: data ?? [],
    watchlistLoading: isLoading,
    error: error instanceof Error ? error : error ? new Error('Failed to load watchlist') : null,
  }
}
