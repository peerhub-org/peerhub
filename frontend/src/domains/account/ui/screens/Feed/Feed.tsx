import { useLoaderData } from 'react-router'
import accountService from '@domains/account/application/services/accountService'
import { Account } from '@domains/account/application/interfaces/Account'
import { useFeedScreen } from './useFeedScreen'
import {
  FeedReviewSuggestions,
  MobileFeedReviewSuggestions,
} from './components/FeedReviewSuggestions'
import { FeedSidebar } from './components/FeedSidebar'
import { FeedMainContent } from './components/FeedMainContent'
import { FeedWatchlistModal } from './components/FeedWatchlistModal'
import { FirstReviewModal } from './components/FirstReviewModal'

type LoaderData = {
  account: Account
}

export async function loader(): Promise<LoaderData> {
  try {
    const account = await accountService.getAccount()
    return { account }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Feed loader]', error)
    }
    throw new Response('Failed to load feed', { status: 500 })
  }
}

export default function Feed() {
  const data = useLoaderData<LoaderData>()
  const {
    watchlistModalOpen,
    setWatchlistModalOpen,
    firstReviewModalOpen,
    dismissFirstReviewModal,
    hasNoReviews,
    panelRef,
    activeTab,
    feedItems,
    loading,
    loadingMore,
    hasMore,
    sentinelRef,
    handleTabChange,
    watchlist,
    watchlistLoading,
    watchlistError,
    sidebarSuggestions,
    modalSuggestions,
    reviewSuggestionsLoading,
    feedError,
  } = useFeedScreen(data.account)

  return (
    <>
      <FeedSidebar
        panelRef={panelRef}
        reviewSuggestionsWidget={
          <FeedReviewSuggestions
            reviewSuggestions={sidebarSuggestions}
            reviewSuggestionsLoading={reviewSuggestionsLoading}
          />
        }
        watchlist={watchlist}
        watchlistLoading={watchlistLoading}
        watchlistError={watchlistError}
        onOpenAllWatchlist={() => setWatchlistModalOpen(true)}
      />
      <FeedMainContent
        activeTab={activeTab}
        onTabChange={handleTabChange}
        feedItems={feedItems}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        feedError={feedError}
        currentUsername={data.account.username}
        sentinelRef={sentinelRef}
        mobileReviewSuggestionsWidget={
          <MobileFeedReviewSuggestions
            reviewSuggestions={sidebarSuggestions}
            reviewSuggestionsLoading={reviewSuggestionsLoading}
          />
        }
      />
      <FeedWatchlistModal
        open={watchlistModalOpen}
        watchlist={watchlist}
        onClose={() => setWatchlistModalOpen(false)}
      />
      {hasNoReviews && (
        <FirstReviewModal
          open={firstReviewModalOpen}
          suggestions={modalSuggestions}
          loading={reviewSuggestionsLoading}
          onClose={dismissFirstReviewModal}
        />
      )}
    </>
  )
}
