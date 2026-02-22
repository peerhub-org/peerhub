import { Box, Container, Tab, Tabs, Typography } from '@mui/material'
import { RefObject, ReactNode } from 'react'
import { ActivityFeedItem } from '@domains/account/application/interfaces/ActivityFeed'
import { UI_COPY } from '@shared/application/config/uiCopy'
import InlineError from '@shared/ui/components/InlineError/InlineError'
import ActivityFeed from '@domains/account/ui/components/ActivityFeed/ActivityFeed'
import { MainContent, PageWrapper } from '../Feed.styled'

interface FeedMainContentProps {
  activeTab: 'all' | 'mine' | 'watching'
  onTabChange: (_: unknown, newValue: 'all' | 'mine' | 'watching') => void
  feedItems: ActivityFeedItem[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  feedError: Error | null
  currentUsername: string
  myReviewIds: Set<string>
  sentinelRef: RefObject<HTMLDivElement | null>
  mobileReviewSuggestionsWidget: ReactNode
}

export function FeedMainContent({
  activeTab,
  onTabChange,
  feedItems,
  loading,
  loadingMore,
  hasMore,
  feedError,
  currentUsername,
  myReviewIds,
  sentinelRef,
  mobileReviewSuggestionsWidget,
}: FeedMainContentProps) {
  return (
    <PageWrapper>
      <Container maxWidth='md'>
        <MainContent>
          {mobileReviewSuggestionsWidget}
          <Typography variant='body1' sx={{ mb: 2, fontWeight: 600 }}>
            {UI_COPY.feedTitle}
          </Typography>
          <Tabs value={activeTab} onChange={onTabChange} sx={{ mb: 2 }}>
            <Tab value='all' label={UI_COPY.feedTabAll} />
            <Tab value='mine' label={UI_COPY.feedTabMine} />
            <Tab value='watching' label={UI_COPY.feedTabOthers} />
          </Tabs>
          {!feedError && (
            <ActivityFeed
              items={feedItems}
              loading={loading}
              loadingMore={loadingMore}
              hasMore={hasMore}
              currentUsername={currentUsername}
              myReviewIds={myReviewIds}
              sentinelRef={sentinelRef}
            />
          )}
          {feedError && (
            <Box sx={{ mt: 2 }}>
              <InlineError message={UI_COPY.feedLoadFeedError} />
            </Box>
          )}
        </MainContent>
      </Container>
    </PageWrapper>
  )
}
