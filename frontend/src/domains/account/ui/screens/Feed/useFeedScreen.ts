import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@domains/authentication/application/hooks/useAuthentication'
import { useActivityFeed } from '@domains/account/application/hooks/useActivityFeed'
import { useWatchlist } from '@domains/watchlist/application/hooks/useWatchlist'
import { useReviewSuggestions } from '@domains/reviews/application/hooks/useReviewSuggestions'
import { Review } from '@domains/reviews/application/interfaces/Review'
import { useAsyncData } from '@shared/application/hooks/useAsyncData'
import reviewService from '@domains/reviews/application/services/reviewService'
import { Account } from '@domains/account/application/interfaces/Account'
import { HEADER_HEIGHT_PX } from '@shared/application/config/appConstants'
import { useStickyHeaderOffset } from '@shared/application/hooks/useStickyHeaderOffset'

export function useFeedScreen(loaderAccount: Account) {
  const { account, setAccount } = useAuth()
  const [watchlistModalOpen, setWatchlistModalOpen] = useState(false)
  const [firstReviewModalDismissed, setFirstReviewModalDismissed] = useState(false)
  const panelRef = useStickyHeaderOffset<HTMLDivElement>(HEADER_HEIGHT_PX)

  const {
    activeTab,
    feedItems,
    loading,
    loadingMore,
    hasMore,
    error: feedError,
    sentinelRef,
    handleTabChange,
  } = useActivityFeed()

  const { watchlist, watchlistLoading, error: watchlistError } = useWatchlist()

  const fetchMyReviews = useMemo(() => () => reviewService.getMyReviews(), [])
  const { data: myReviews, loading: myReviewsLoading } = useAsyncData<Review[]>({
    fetcher: fetchMyReviews,
    initialData: [],
  })

  const hasNoReviews = !myReviewsLoading && myReviews.length === 0

  const {
    reviewSuggestions,
    reviewSuggestionsLoading,
    error: reviewSuggestionsError,
  } = useReviewSuggestions(hasNoReviews ? 16 : 4)

  const sidebarSuggestions = useMemo(() => reviewSuggestions.slice(0, 4), [reviewSuggestions])

  const firstReviewModalOpen =
    !firstReviewModalDismissed &&
    hasNoReviews &&
    !reviewSuggestionsLoading &&
    reviewSuggestions.length > 0

  useEffect(() => {
    if (!account) {
      setAccount(loaderAccount)
    }
  }, [account, loaderAccount, setAccount])

  useEffect(() => {
    document.title = 'PeerHub - Feed'
  }, [])

  return {
    watchlistModalOpen,
    setWatchlistModalOpen,
    firstReviewModalOpen,
    dismissFirstReviewModal: () => setFirstReviewModalDismissed(true),
    hasNoReviews,
    panelRef,
    activeTab,
    feedItems,
    loading,
    loadingMore,
    hasMore,
    feedError,
    sentinelRef,
    handleTabChange,
    watchlist,
    watchlistLoading,
    watchlistError,
    sidebarSuggestions,
    modalSuggestions: reviewSuggestions,
    reviewSuggestionsLoading,
    reviewSuggestionsError,
  }
}
