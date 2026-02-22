import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { FeedFilter } from '@domains/account/application/interfaces/ActivityFeed'
import { FeedRepository } from '@domains/account/application/interfaces/FeedRepository'
import { feedRepository } from '@domains/account/application/services/feedRepository'
import { INFINITE_SCROLL_ROOT_MARGIN, PAGE_SIZE } from '@shared/application/config/appConstants'
import { queryKeys } from '@shared/application/queryKeys'

export function useActivityFeed(repository: FeedRepository = feedRepository) {
  const [activeTab, setActiveTab] = useState<FeedFilter>('all')
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, error, fetchNextPage } =
    useInfiniteQuery({
      queryKey: queryKeys.feed.list(activeTab),
      queryFn: ({ pageParam }) => repository.getActivityFeed(activeTab, PAGE_SIZE, pageParam),
      initialPageParam: 0,
      gcTime: 0,
      staleTime: 0,
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage.has_more) {
          return undefined
        }

        return allPages.reduce((total, page) => total + page.items.length, 0)
      },
    })

  const feedItems = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])

  const handleTabChange = (_: unknown, newValue: FeedFilter) => {
    setActiveTab(newValue)
  }

  const loadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage || isLoading) {
      return
    }

    await fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void loadMore()
        }
      },
      { rootMargin: INFINITE_SCROLL_ROOT_MARGIN },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  return {
    activeTab,
    feedItems,
    loading: isLoading || (isFetching && !isFetchingNextPage),
    loadingMore: isFetchingNextPage,
    hasMore: hasNextPage ?? false,
    error: error instanceof Error ? error : error ? new Error('Failed to load feed') : null,
    sentinelRef,
    handleTabChange,
  }
}
