import { RefObject } from 'react'
import {
  Badge,
  Box,
  Typography,
  Avatar,
  Skeleton,
  useTheme,
  Tooltip,
  CircularProgress,
} from '@mui/material'
import { ActivityFeedItem } from '@domains/account/application/interfaces/ActivityFeed'
import { getStatusColor, getStatusIcon } from '@shared/application/utils/reviewStatus'
import { getAnonymousReviewDisplay } from '@shared/application/utils/anonymousReview'
import { timeAgo, formatFullDate } from '@shared/application/utils/dateFormatting'
import { UI_COPY } from '@shared/application/config/uiCopy'
import Incognito from '@shared/ui/components/icons/Incognito'
import EndOfList from '@shared/ui/components/EndOfList/EndOfList'
import {
  FeedItem,
  FeedItemRow,
  CommentCard,
  Content,
  FeedLink,
  StatusCircle,
} from './ActivityFeed.styled'

interface ActivityFeedProps {
  items: ActivityFeedItem[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  currentUsername: string
  myReviewIds: Set<string>
  sentinelRef: RefObject<HTMLDivElement | null>
}

export default function ActivityFeed({
  items,
  loading,
  loadingMore,
  hasMore,
  currentUsername,
  myReviewIds,
  sentinelRef,
}: ActivityFeedProps) {
  const theme = useTheme()

  if (loading) {
    return (
      <Box>
        <FeedItem elevation={0}>
          <FeedItemRow>
            <Skeleton variant='circular' width={40} height={40} />
            <Content>
              <Skeleton variant='text' width='50%' height={20} />
              <Skeleton variant='text' width={80} height={16} />
            </Content>
          </FeedItemRow>
        </FeedItem>
        <FeedItem elevation={0}>
          <FeedItemRow>
            <Skeleton variant='circular' width={40} height={40} />
            <Content>
              <Skeleton variant='text' width='50%' height={20} />
              <Skeleton variant='text' width={80} height={16} />
            </Content>
          </FeedItemRow>
          <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Skeleton variant='text' width='100%' />
            <Skeleton variant='text' width='40%' />
          </Box>
        </FeedItem>
        <FeedItem elevation={0}>
          <FeedItemRow>
            <Skeleton variant='circular' width={40} height={40} />
            <Content>
              <Skeleton variant='text' width='50%' height={20} />
              <Skeleton variant='text' width={80} height={16} />
            </Content>
          </FeedItemRow>
        </FeedItem>
      </Box>
    )
  }

  if (items.length === 0) {
    return (
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ textAlign: 'center', fontStyle: 'italic', paddingTop: 4 }}
      >
        {UI_COPY.feedNoActivity}
      </Typography>
    )
  }

  return (
    <Box>
      {items.map((item) => (
        <FeedItem
          key={item.review_id}
          elevation={0}
          sx={
            item.reviewed_username === currentUsername
              ? { borderLeft: `3px solid ${theme.palette.primary.main}` }
              : undefined
          }
        >
          <FeedItemRow>
            <Badge
              overlap='circular'
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <StatusCircle statusColor={getStatusColor(theme, item.status)}>
                  {getStatusIcon(theme, item.status, false, 14)}
                </StatusCircle>
              }
            >
              <Avatar src={item.reviewed_user_avatar_url || undefined}>
                {item.reviewed_username.charAt(0).toUpperCase()}
              </Avatar>
            </Badge>
            <Content>
              <Typography variant='body2'>
                <FeedLink to={`/${item.reviewed_username}`}>
                  <strong>
                    {item.reviewed_username === currentUsername ? 'You' : item.reviewed_username}
                  </strong>
                </FeedLink>{' '}
                <span style={{ color: 'text.secondary' }}>received a review from</span>{' '}
                {(() => {
                  const isCurrentUser = myReviewIds.has(item.review_id)
                  const { showAnonymous, isOwnAnonymousReview, displayName } =
                    getAnonymousReviewDisplay(item, isCurrentUser, {
                      username: currentUsername,
                      avatarUrl: null,
                    })
                  if (showAnonymous) {
                    return 'anonymous'
                  }
                  if (isOwnAnonymousReview) {
                    return (
                      <Tooltip title='Visible to you only' arrow>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <Typography
                            component='span'
                            variant='body2'
                            sx={{ color: 'text.disabled', fontWeight: 600 }}
                          >
                            you
                          </Typography>
                          <Incognito sx={{ fontSize: 14, color: 'text.disabled' }} />
                        </span>
                      </Tooltip>
                    )
                  }
                  return (
                    <FeedLink to={`/${item.reviewer_username}`}>
                      <strong>{isCurrentUser ? 'you' : displayName}</strong>
                    </FeedLink>
                  )
                })()}
              </Typography>
              <Tooltip title={formatFullDate(item.updated_at)} arrow>
                <Typography variant='caption' color='text.secondary' sx={{ cursor: 'default' }}>
                  {timeAgo(item.updated_at)}
                </Typography>
              </Tooltip>
            </Content>
          </FeedItemRow>
          {item.comment && !item.comment_hidden && (
            <CommentCard>
              <Typography variant='body2' sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                {item.comment}
              </Typography>
            </CommentCard>
          )}
          {item.comment && item.comment_hidden && (
            <CommentCard>
              <Typography variant='body2' sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                {`Comment hidden by ${item.reviewed_username}`}
              </Typography>
            </CommentCard>
          )}
        </FeedItem>
      ))}
      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} />
      {loadingMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {!hasMore && items.length > 0 && <EndOfList />}
    </Box>
  )
}
