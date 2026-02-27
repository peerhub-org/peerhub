import { memo } from 'react'
import { Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Review } from '@domains/reviews/application/interfaces/Review'
import {
  getStatusColor,
  getStatusIcon,
  getStatusText,
} from '@shared/application/utils/reviewStatus'
import { getAnonymousReviewDisplay } from '@shared/application/utils/anonymousReview'
import Incognito from '@shared/ui/components/icons/Incognito'
import {
  ItemContainer,
  ContentArea,
  TimelineLine,
  StatusCircle,
  EventHeader,
  AnonymousAvatar,
  OwnAnonymousAvatar,
  StandardAvatar,
  AvatarLink,
  AnonymousText,
  OwnAnonymousText,
  UsernameLink,
  StatusText,
  OwnAnonymousWrapper,
} from './ReviewTimelineItem.styled'
import { timeAgo, formatFullDate } from '@shared/application/utils/dateFormatting'
import ReviewCommentCard from './ReviewCommentCard'

interface ReviewTimelineItemProps {
  review: Review
  isLast: boolean
  isFirst?: boolean
  isCurrentUser?: boolean
  currentUserInfo?: { username: string; avatarUrl: string | null } | null
  isPageOwner?: boolean
  pageOwnerUsername?: string
  onToggleHidden?: (reviewId: string, hidden: boolean) => void
}

function ReviewTimelineItem({
  review,
  isLast,
  isFirst = false,
  isCurrentUser,
  currentUserInfo,
  isPageOwner,
  pageOwnerUsername,
  onToggleHidden,
}: ReviewTimelineItemProps) {
  const theme = useTheme()

  const { isOwnAnonymousReview, showAnonymous, displayName, avatarUrl } = getAnonymousReviewDisplay(
    review,
    !!isCurrentUser,
    currentUserInfo,
  )

  return (
    <ItemContainer>
      {/* Avatar */}
      {showAnonymous ? (
        <AnonymousAvatar>
          <Incognito sx={{ color: theme.palette.text.secondary, fontSize: 28 }} />
        </AnonymousAvatar>
      ) : isOwnAnonymousReview ? (
        <Tooltip title='Avatar is visible to you only' arrow>
          <OwnAnonymousAvatar src={avatarUrl || undefined}>
            {displayName.charAt(0).toUpperCase()}
          </OwnAnonymousAvatar>
        </Tooltip>
      ) : (
        <AvatarLink to={`/${review.reviewer_username}`}>
          <StandardAvatar src={avatarUrl || undefined}>
            {displayName.charAt(0).toUpperCase()}
          </StandardAvatar>
        </AvatarLink>
      )}

      {/* Content */}
      <ContentArea>
        {!isFirst && <TimelineLine sx={{ top: 0, height: 32 }} />}
        <TimelineLine sx={{ top: 32, bottom: isLast ? 0 : -24 }} />

        {/* Event header */}
        <EventHeader>
          <StatusCircle statusColor={getStatusColor(theme, review.status)}>
            {getStatusIcon(theme, review.status, false)}
          </StatusCircle>
          {showAnonymous ? (
            <AnonymousText>anonymous</AnonymousText>
          ) : isOwnAnonymousReview ? (
            <Tooltip title='Username is visible to you only' arrow>
              <OwnAnonymousWrapper>
                <OwnAnonymousText>{displayName}</OwnAnonymousText>
                <Incognito sx={{ color: theme.palette.text.disabled, fontSize: 14 }} />
              </OwnAnonymousWrapper>
            </Tooltip>
          ) : (
            <UsernameLink to={`/${review.reviewer_username}`}>{displayName}</UsernameLink>
          )}
          <StatusText variant='body2'>
            {getStatusText(review.status)}{' '}
            <Tooltip title={formatFullDate(review.updated_at)} arrow>
              <span style={{ cursor: 'default' }}>{timeAgo(review.updated_at)}</span>
            </Tooltip>
          </StatusText>
        </EventHeader>

        {/* Comment card */}
        <ReviewCommentCard
          review={review}
          showAnonymous={showAnonymous}
          isOwnAnonymousReview={isOwnAnonymousReview}
          isCurrentUser={isCurrentUser}
          displayName={displayName}
          isPageOwner={isPageOwner}
          pageOwnerUsername={pageOwnerUsername}
          onToggleHidden={onToggleHidden}
        />
      </ContentArea>
    </ItemContainer>
  )
}

export default memo(ReviewTimelineItem)
