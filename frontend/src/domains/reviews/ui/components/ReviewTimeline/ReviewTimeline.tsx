import { RefObject, useMemo } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { GitHub, LockOutline } from '@mui/icons-material'
import { GitHubSignInButton } from '@shared/ui/styled'
import { useTheme } from '@mui/material/styles'
import { Review } from '@domains/reviews/application/interfaces/Review'
import { User } from '@domains/profiles/application/interfaces/User'
import ReviewTimelineItem from './ReviewTimelineItem'
import AuthorBioCard from '@domains/reviews/ui/components/AuthorBioCard/AuthorBioCard'
import { useReviewContext } from '@domains/reviews/ui/context/ReviewContext'
import EndOfList from '@shared/ui/components/EndOfList/EndOfList'
import { useGitHubSignIn } from '@domains/authentication/application/hooks/useGitHubSignIn'
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
  const { myReviewIds, currentUserInfo, isPageOwner, isDraftLocked, isGuest } = useReviewContext()
  const isLocked = isDraftLocked || isGuest
  const handleSignIn = useGitHubSignIn()

  const placeholderRows = useMemo(() => {
    const count = ((user.username.length % 3) + 1) as 1 | 2 | 3

    const cardPatterns: Record<1 | 2 | 3, boolean[]> = {
      1: [true],
      2: [false, true],
      3: [false, true, false],
    }

    return cardPatterns[count].map((hasCard, i) => ({ key: i, hasCard }))
  }, [user.username])

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
      ) : reviews.length === 0 && !loadingMore && !isLocked ? (
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
      {!hasMore && reviews.length > 0 && !isLocked && !refreshing && <EndOfList />}

      {isLocked && (
        <DraftPlaceholderContainer>
          {placeholderRows.map(({ key, hasCard }) => (
            <DraftPlaceholderContent key={key}>
              <PlaceholderAvatar />
              <PlaceholderContent>
                <PlaceholderHeader>
                  <PlaceholderStatusCircle />
                  <Box sx={{ width: '30%', height: 16, bgcolor: 'divider', borderRadius: 1 }} />
                </PlaceholderHeader>
                {hasCard && (
                  <PlaceholderCard>
                    <PlaceholderCardHeader />
                    <PlaceholderCardBody>
                      <Box
                        sx={{
                          width: '100%',
                          height: 10,
                          bgcolor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      />
                      <Box sx={{ width: '50%', height: 10, bgcolor: 'divider', borderRadius: 1 }} />
                    </PlaceholderCardBody>
                  </PlaceholderCard>
                )}
              </PlaceholderContent>
            </DraftPlaceholderContent>
          ))}
          <DraftOverlay>
            <LockOutline sx={{ color: 'text.secondary', fontSize: 32 }} />
            <Typography
              variant='body2'
              sx={{ color: theme.palette.text.secondary, textAlign: 'center' }}
            >
              {isDraftLocked
                ? `Other users' reviews will be shown when ${user.username} is open to reviews`
                : `Sign in to see ${user.username}'s reviews`}
            </Typography>
            {isGuest && (
              <GitHubSignInButton
                variant='contained'
                size='small'
                startIcon={<GitHub />}
                onClick={handleSignIn}
                sx={{ mt: 1 }}
              >
                Sign in with GitHub
              </GitHubSignInButton>
            )}
          </DraftOverlay>
        </DraftPlaceholderContainer>
      )}
    </Box>
  )
}
