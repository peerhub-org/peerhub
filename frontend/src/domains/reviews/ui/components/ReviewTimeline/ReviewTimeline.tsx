import { RefObject } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { LockOutline } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { Review } from '@domains/reviews/application/interfaces/Review'
import { User } from '@domains/profiles/application/interfaces/User'
import ReviewTimelineItem from './ReviewTimelineItem'
import AuthorBioCard from '@domains/reviews/ui/components/AuthorBioCard/AuthorBioCard'
import { useReviewContext } from '@domains/reviews/ui/context/ReviewContext'
import EndOfList from '@shared/ui/components/EndOfList/EndOfList'
import {
  EmptyStateContainer,
  DraftPlaceholderContainer,
  DraftPlaceholderContent,
  PlaceholderAvatar,
  PlaceholderContent,
  PlaceholderHeader,
  PlaceholderStatusCircle,
  PlaceholderCard,
  PlaceholderCardHeader,
  PlaceholderCardBody,
  DraftOverlay,
} from './ReviewTimeline.styled'

interface ReviewTimelineProps {
  user: User
  reviews: Review[]
  refreshing?: boolean
  emptyMessage?: string
  onToggleHidden?: (reviewId: string, hidden: boolean) => void
  onRefreshUser?: () => void
  sentinelRef?: RefObject<HTMLDivElement | null>
  loadingMore?: boolean
  hasMore?: boolean
}

export default function ReviewTimeline({
  user,
  reviews,
  refreshing = false,
  emptyMessage = 'No reviews yet.',
  onToggleHidden,
  onRefreshUser,
  sentinelRef,
  loadingMore = false,
  hasMore = true,
}: ReviewTimelineProps) {
  const theme = useTheme()
  const { myReviewIds, currentUserInfo, isPageOwner } = useReviewContext()
  const isDraft = !user.created_at

  return (
    <Box>
      <AuthorBioCard
        user={user}
        hasReviews={reviews.length > 0}
        isPageOwner={isPageOwner}
        onRefresh={onRefreshUser}
      />

      {refreshing ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : reviews.length === 0 && !loadingMore && !isDraft ? (
        <EmptyStateContainer>
          <Typography
            variant='body2'
            sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}
          >
            {emptyMessage}
          </Typography>
        </EmptyStateContainer>
      ) : (
        reviews.map((review, index) => (
          <ReviewTimelineItem
            key={review.id}
            review={review}
            isLast={index === reviews.length - 1}
            isCurrentUser={myReviewIds.has(review.id)}
            currentUserInfo={currentUserInfo}
            isPageOwner={isPageOwner}
            pageOwnerUsername={user.username}
            onToggleHidden={onToggleHidden}
          />
        ))
      )}

      {/* Sentinel for infinite scroll */}
      {sentinelRef && <div ref={sentinelRef} />}
      {loadingMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {!hasMore && reviews.length > 0 && !isDraft && !refreshing && <EndOfList />}

      {isDraft && !isPageOwner && (
        <DraftPlaceholderContainer>
          <DraftPlaceholderContent>
            <PlaceholderAvatar></PlaceholderAvatar>
            <PlaceholderContent>
              <PlaceholderHeader>
                <PlaceholderStatusCircle />
                <Box sx={{ width: '30%', height: 16, bgcolor: 'divider', borderRadius: 1 }} />
              </PlaceholderHeader>
              <PlaceholderCard>
                <PlaceholderCardHeader />
                <PlaceholderCardBody />
              </PlaceholderCard>
            </PlaceholderContent>
          </DraftPlaceholderContent>
          <DraftOverlay>
            <LockOutline sx={{ color: 'text.secondary', fontSize: 32 }} />
            <Typography
              variant='body2'
              sx={{ color: theme.palette.text.secondary, textAlign: 'center' }}
            >
              Other users&apos; reviews will be shown when {user.username} is open to reviews
            </Typography>
          </DraftOverlay>
        </DraftPlaceholderContainer>
      )}
    </Box>
  )
}
