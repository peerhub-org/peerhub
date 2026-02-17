import { ReactNode, RefObject } from 'react'
import { Box, List, ListItemAvatar, ListItemText, Skeleton, Typography } from '@mui/material'
import { Link } from 'react-router'
import { Watch } from '@domains/watchlist/application/interfaces/Watch'
import { WATCHLIST_PREVIEW_LIMIT } from '@shared/application/config/appConstants'
import { UI_COPY } from '@shared/application/config/uiCopy'
import { SecondaryButton } from '@shared/ui/styled'
import OpenSourceFooter from '@shared/ui/components/OpenSourceFooter/OpenSourceFooter'
import InlineError from '@shared/ui/components/InlineError/InlineError'
import { WatchlistPanel, SmallAvatar, WatchListItem } from '../Feed.styled'

interface FeedSidebarProps {
  panelRef: RefObject<HTMLDivElement | null>
  reviewSuggestionsWidget: ReactNode
  watchlist: Watch[]
  watchlistLoading: boolean
  watchlistError: Error | null
  onOpenAllWatchlist: () => void
}

export function FeedSidebar({
  panelRef,
  reviewSuggestionsWidget,
  watchlist,
  watchlistLoading,
  watchlistError,
  onOpenAllWatchlist,
}: FeedSidebarProps) {
  return (
    <WatchlistPanel ref={panelRef}>
      {reviewSuggestionsWidget}
      <Typography variant='body2' fontWeight={500} sx={{ mb: 1.5 }}>
        {UI_COPY.feedWatchlistTitle}
      </Typography>
      <List disablePadding>
        {watchlistLoading
          ? Array.from({ length: WATCHLIST_PREVIEW_LIMIT }).map((_, index) => (
              <WatchListItem key={index} sx={{ mb: 0.5 }}>
                <ListItemAvatar sx={{ minWidth: 36 }}>
                  <Skeleton variant='circular' width={24} height={24} />
                </ListItemAvatar>
                <Skeleton variant='text' width='100%' height={20} />
              </WatchListItem>
            ))
          : watchlist.slice(0, WATCHLIST_PREVIEW_LIMIT).map((watch) => (
              <WatchListItem key={watch.id} component={Link} to={`/${watch.watched_username}`}>
                <ListItemAvatar sx={{ minWidth: 36 }}>
                  <SmallAvatar
                    src={watch.watched_avatar_url || undefined}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {watch.watched_username.charAt(0).toUpperCase()}
                  </SmallAvatar>
                </ListItemAvatar>
                <ListItemText
                  primary={watch.watched_name || watch.watched_username}
                  slotProps={{ primary: { noWrap: true, fontSize: '0.8rem' } }}
                />
              </WatchListItem>
            ))}
        {!watchlistLoading && !watchlistError && watchlist.length === 0 && (
          <Typography variant='caption' color='text.secondary' sx={{ px: 1, fontStyle: 'italic' }}>
            {UI_COPY.feedNoWatchlist}
          </Typography>
        )}
      </List>
      {watchlistError && (
        <Box sx={{ mt: 1 }}>
          <InlineError message={UI_COPY.feedLoadWatchlistError} />
        </Box>
      )}
      {watchlistLoading && <Skeleton variant='rounded' width='100%' height={30} />}
      {!watchlistLoading && !watchlistError && watchlist.length > WATCHLIST_PREVIEW_LIMIT && (
        <SecondaryButton
          fullWidth
          size='small'
          onClick={onOpenAllWatchlist}
          sx={{ mt: 0.5, fontSize: '0.75rem' }}
        >
          {UI_COPY.feedSeeAll}
        </SecondaryButton>
      )}
      <OpenSourceFooter
        variant='caption'
        sx={{
          display: 'block',
          mt: 3,
          pt: 2,
          borderTop: 1,
          borderColor: 'divider',
          textAlign: 'center',
        }}
      />
    </WatchlistPanel>
  )
}
