import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import watchlistService from '@domains/watchlist/application/services/watchlistService'
import { queryKeys } from '@shared/application/queryKeys'

export function useWatchButton(username: string, initialWatched?: boolean) {
  const queryClient = useQueryClient()
  const watchQueryKey = queryKeys.watchlist.check(username)

  const { data: watchedData, isLoading } = useQuery({
    queryKey: watchQueryKey,
    queryFn: () => watchlistService.checkWatch(username),
    initialData:
      initialWatched === undefined
        ? undefined
        : () => queryClient.getQueryData<boolean>(watchQueryKey) ?? initialWatched,
  })

  const { mutateAsync, isPending: actionLoading } = useMutation({
    mutationFn: async (nextWatched: boolean) => {
      if (nextWatched) {
        await watchlistService.watch(username)
        return true
      }
      await watchlistService.unwatch(username)
      return false
    },
    onMutate: (nextWatched) => {
      const previousWatchState = queryClient.getQueryData<boolean>(watchQueryKey)
      queryClient.setQueryData(watchQueryKey, nextWatched)
      return { previousWatchState }
    },
    onError: (_error, _nextWatched, context) => {
      queryClient.setQueryData(watchQueryKey, context?.previousWatchState ?? false)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: watchQueryKey })
      void queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.list() })
    },
  })

  const isWatched = watchedData ?? false
  const initialLoading = initialWatched === undefined && isLoading

  const toggleWatch = async () => {
    const nextWatched = !isWatched
    await mutateAsync(nextWatched)
    return nextWatched
  }

  return { isWatched, initialLoading, actionLoading, toggleWatch }
}
