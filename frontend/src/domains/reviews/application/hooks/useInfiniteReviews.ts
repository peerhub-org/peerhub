import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { PaginatedReviews } from '@domains/reviews/application/interfaces/Review'
import { ReviewRepository } from '@domains/reviews/application/interfaces/ReviewRepository'
import { reviewRepository } from '@domains/reviews/application/services/reviewRepository'
import { INFINITE_SCROLL_ROOT_MARGIN, PAGE_SIZE } from '@shared/application/config/appConstants'
import { queryKeys } from '@shared/application/queryKeys'

type FilterTab = 'all' | 'approve' | 'comment' | 'request_change'

function updateHiddenState(
  cachedData: InfiniteData<PaginatedReviews> | undefined,
  reviewId: string,
  hidden: boolean,
): InfiniteData<PaginatedReviews> | undefined {
  if (!cachedData) {
    return cachedData
  }

  return {
    ...cachedData,
    pages: cachedData.pages.map((page) => ({
      ...page,
      items: page.items.map((review) =>
        review.id === reviewId ? { ...review, comment_hidden: hidden } : review,
      ),
    })),
  }
}

export function useInfiniteReviews(
  username: string,
  initialPaginatedReviews: PaginatedReviews,
  repository: ReviewRepository = reviewRepository,
) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [mountTime] = useState(() => Date.now())
  const queryClient = useQueryClient()
  const statusFilter = activeTab === 'all' ? undefined : activeTab
  const reviewListPrefix = useMemo(
    () => [...queryKeys.reviews.all, 'list', username] as const,
    [username],
  )

  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: queryKeys.reviews.list(username, statusFilter),
      queryFn: ({ pageParam }) =>
        repository.getReviews(username, PAGE_SIZE, pageParam, statusFilter),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage.has_more) {
          return undefined
        }

        return allPages.reduce((total, page) => total + page.items.length, 0)
      },
      initialData:
        statusFilter === undefined
          ? ({
              pages: [initialPaginatedReviews],
              pageParams: [0],
            } as InfiniteData<PaginatedReviews, number>)
          : undefined,
      initialDataUpdatedAt: statusFilter === undefined ? mountTime : undefined,
    })

  const reviews = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])

  const { mutateAsync: mutateToggleHidden } = useMutation({
    mutationFn: ({ reviewId, hidden }: { reviewId: string; hidden: boolean }) =>
      repository.toggleCommentHidden(reviewId, hidden),
    onMutate: async ({ reviewId, hidden }) => {
      await queryClient.cancelQueries({ queryKey: reviewListPrefix })

      const previousQueries = queryClient.getQueriesData<InfiniteData<PaginatedReviews>>({
        queryKey: reviewListPrefix,
      })

      queryClient.setQueriesData<InfiniteData<PaginatedReviews>>(
        { queryKey: reviewListPrefix },
        (cachedData) => updateHiddenState(cachedData, reviewId, hidden),
      )

      return { previousQueries }
    },
    onError: (_error, _variables, context) => {
      context?.previousQueries.forEach(([key, cachedData]) => {
        queryClient.setQueryData(key as QueryKey, cachedData)
      })
    },
    onSuccess: (updatedReview) => {
      queryClient.setQueriesData<InfiniteData<PaginatedReviews>>(
        { queryKey: reviewListPrefix },
        (cachedData) =>
          updateHiddenState(cachedData, updatedReview.id, updatedReview.comment_hidden),
      )
    },
  })

  const handleTabChange = (_: unknown, newValue: FilterTab) => {
    setActiveTab(newValue)
  }

  const loadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) {
      return
    }

    await fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const handleToggleHidden = useCallback(
    async (reviewId: string, hidden: boolean) => {
      try {
        await mutateToggleHidden({ reviewId, hidden })
      } catch {
        // Error handling
      }
    },
    [mutateToggleHidden],
  )

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

  const refresh = useCallback(async () => {
    setActiveTab('all')
    await queryClient.invalidateQueries({ queryKey: reviewListPrefix })
  }, [queryClient, reviewListPrefix])

  return {
    activeTab,
    reviews,
    loading: isLoading || (isFetching && !isFetchingNextPage),
    loadingMore: isFetchingNextPage,
    hasMore: hasNextPage ?? false,
    sentinelRef,
    handleTabChange,
    handleToggleHidden,
    refresh,
  }
}
