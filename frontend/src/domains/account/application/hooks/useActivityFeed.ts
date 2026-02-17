import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityFeedItem, FeedFilter } from '@domains/account/application/interfaces/ActivityFeed'
import { FeedRepository } from '@domains/account/application/interfaces/FeedRepository'
import { feedRepository } from '@domains/account/application/services/feedRepository'
import { INFINITE_SCROLL_ROOT_MARGIN, PAGE_SIZE } from '@shared/application/config/appConstants'

export function useActivityFeed(repository: FeedRepository = feedRepository) {
  const [activeTab, setActiveTab] = useState<FeedFilter>('all')
  const [feedItems, setFeedItems] = useState<ActivityFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const tabRequestId = useRef(0)
  const loadMoreRequestId = useRef(0)

  const loadTab = useCallback(
    async (tab: FeedFilter) => {
      const requestId = ++tabRequestId.current
      setActiveTab(tab)
      setLoading(true)
      setLoadingMore(false)
      setHasMore(true)
      setError(null)
      try {
        const feed = await repository.getActivityFeed(tab, PAGE_SIZE, 0)
        if (requestId !== tabRequestId.current) return
        setFeedItems(feed.items)
        setHasMore(feed.has_more)
      } catch (err) {
        if (requestId !== tabRequestId.current) return
        setFeedItems([])
        setHasMore(false)
        setError(err instanceof Error ? err : new Error('Failed to load feed'))
      } finally {
        if (requestId === tabRequestId.current) {
          setLoading(false)
        }
      }
    },
    [repository],
  )

  const handleTabChange = async (_: unknown, newValue: FeedFilter) => {
    await loadTab(newValue)
  }

  useEffect(() => {
    loadTab('all')
  }, [loadTab])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return
    const requestId = ++loadMoreRequestId.current
    setLoadingMore(true)
    try {
      const feed = await repository.getActivityFeed(activeTab, PAGE_SIZE, feedItems.length)
      if (requestId !== loadMoreRequestId.current) return
      setFeedItems((previous) => [...previous, ...feed.items])
      setHasMore(feed.has_more)
    } catch (err) {
      if (requestId !== loadMoreRequestId.current) return
      setHasMore(false)
      setError(err instanceof Error ? err : new Error('Failed to load more feed items'))
    } finally {
      if (requestId === loadMoreRequestId.current) {
        setLoadingMore(false)
      }
    }
  }, [activeTab, feedItems.length, hasMore, loading, loadingMore, repository])

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

  return {
    activeTab,
    feedItems,
    loading,
    loadingMore,
    hasMore,
    error,
    sentinelRef,
    handleTabChange,
  }
}
