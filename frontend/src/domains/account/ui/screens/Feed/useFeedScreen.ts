import { useEffect, useState } from 'react'
import { useAuth } from '@domains/authentication/application/hooks/useAuthentication'
import { useActivityFeed } from '@domains/account/application/hooks/useActivityFeed'
import { useWatchlist } from '@domains/watchlist/application/hooks/useWatchlist'
import { useReviewSuggestions } from '@domains/reviews/application/hooks/useReviewSuggestions'
import { Account } from '@domains/account/application/interfaces/Account'
import { HEADER_HEIGHT_PX } from '@shared/application/config/appConstants'
import { useStickyHeaderOffset } from '@shared/application/hooks/useStickyHeaderOffset'

export function useFeedScreen(loaderAccount: Account) {
  const { account, setAccount } = useAuth()
  const [watchlistModalOpen, setWatchlistModalOpen] = useState(false)
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

  const {
    reviewSuggestions,
    reviewSuggestionsLoading,
    error: reviewSuggestionsError,
  } = useReviewSuggestions()

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
    reviewSuggestions,
    reviewSuggestionsLoading,
    reviewSuggestionsError,
  }
}
