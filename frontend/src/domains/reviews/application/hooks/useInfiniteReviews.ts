import { useCallback, useEffect, useRef, useState } from 'react'
import { Review, PaginatedReviews } from '@domains/reviews/application/interfaces/Review'
import { ReviewRepository } from '@domains/reviews/application/interfaces/ReviewRepository'
import { reviewRepository } from '@domains/reviews/application/services/reviewRepository'
import { INFINITE_SCROLL_ROOT_MARGIN, PAGE_SIZE } from '@shared/application/config/appConstants'

type FilterTab = 'all' | 'approve' | 'comment' | 'request_change'

export function useInfiniteReviews(
  username: string,
  initialData: PaginatedReviews,
  repository: ReviewRepository = reviewRepository,
) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [reviews, setReviews] = useState<Review[]>(initialData.items)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialData.has_more)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setReviews(initialData.items)
    setHasMore(initialData.has_more)
    setActiveTab('all')
    setLoading(false)
  }, [initialData])

  const handleTabChange = async (_: unknown, newValue: FilterTab) => {
    setActiveTab(newValue)
    setLoading(true)
    setHasMore(false)
    setReviews([])
    try {
      const statusFilter = newValue === 'all' ? undefined : newValue
      const data = await repository.getReviews(username, PAGE_SIZE, 0, statusFilter)
      setReviews(data.items)
      setHasMore(data.has_more)
    } catch {
      setReviews([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const statusFilter = activeTab === 'all' ? undefined : activeTab
      const data = await repository.getReviews(username, PAGE_SIZE, reviews.length, statusFilter)
      setReviews((prev) => [...prev, ...data.items])
      setHasMore(data.has_more)
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [activeTab, hasMore, loadingMore, repository, reviews.length, username])

  const handleToggleHidden = useCallback(
    async (reviewId: string, hidden: boolean) => {
      try {
        const updatedReview = await repository.toggleCommentHidden(reviewId, hidden)
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, comment_hidden: updatedReview.comment_hidden } : r,
          ),
        )
      } catch {
        // Error handling
      }
    },
    [repository],
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: INFINITE_SCROLL_ROOT_MARGIN },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  const refresh = useCallback(async () => {
    setActiveTab('all')
    setLoading(true)
    try {
      const data = await repository.getReviews(username, PAGE_SIZE, 0)
      setReviews(data.items)
      setHasMore(data.has_more)
    } catch {
      setReviews([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [repository, username])

  return {
    activeTab,
    reviews,
    loading,
    loadingMore,
    hasMore,
    sentinelRef,
    handleTabChange,
    handleToggleHidden,
    refresh,
  }
}
