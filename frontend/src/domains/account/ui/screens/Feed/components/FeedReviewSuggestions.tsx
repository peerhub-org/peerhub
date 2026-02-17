import { Box, Skeleton, Typography, useTheme } from '@mui/material'
import { Link } from 'react-router'
import { ReviewSuggestion } from '@domains/reviews/application/interfaces/Review'
import { FEED_REVIEW_SUGGESTION_SKELETON_COUNT } from '@shared/application/config/appConstants'
import { UI_COPY } from '@shared/application/config/uiCopy'
import {
  ReviewSuggestionLink,
  SmallAvatar,
  MobileReviewSuggestionsPanel,
  MobileReviewSuggestionsTitle,
  MobileReviewSuggestionsSkeletonRow,
  MobileReviewSuggestionsScrollContainer,
  MobileReviewSuggestionsRow,
  MobileReviewSuggestionLink,
  MobileReviewSuggestionAvatar,
} from '../Feed.styled'

interface FeedReviewSuggestionsProps {
  reviewSuggestions: ReviewSuggestion[]
  reviewSuggestionsLoading: boolean
}

function ReviewSuggestionRows({ reviewSuggestions }: { reviewSuggestions: ReviewSuggestion[] }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {reviewSuggestions.map((reviewSuggestion) => (
        <ReviewSuggestionLink
          key={reviewSuggestion.username}
          component={Link}
          to={`/${reviewSuggestion.username}`}
        >
          <SmallAvatar src={reviewSuggestion.avatar_url || undefined}>
            {reviewSuggestion.username.charAt(0).toUpperCase()}
          </SmallAvatar>
          <Typography variant='body2' noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {reviewSuggestion.username}
          </Typography>
        </ReviewSuggestionLink>
      ))}
    </Box>
  )
}

function ReviewSuggestionMobileRows({
  reviewSuggestions,
}: {
  reviewSuggestions: ReviewSuggestion[]
}) {
  return (
    <MobileReviewSuggestionsScrollContainer>
      <MobileReviewSuggestionsRow>
        {reviewSuggestions.map((reviewSuggestion) => (
          <MobileReviewSuggestionLink
            key={reviewSuggestion.username}
            component={Link}
            to={`/${reviewSuggestion.username}`}
          >
            <MobileReviewSuggestionAvatar src={reviewSuggestion.avatar_url || undefined}>
              {reviewSuggestion.username.charAt(0).toUpperCase()}
            </MobileReviewSuggestionAvatar>
            <Typography variant='body2' noWrap>
              {reviewSuggestion.username}
            </Typography>
          </MobileReviewSuggestionLink>
        ))}
      </MobileReviewSuggestionsRow>
    </MobileReviewSuggestionsScrollContainer>
  )
}

export function FeedReviewSuggestions({
  reviewSuggestions,
  reviewSuggestionsLoading,
}: FeedReviewSuggestionsProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.background.highlight,
      }}
    >
      <Typography variant='body2' fontWeight={500} sx={{ mb: 2 }}>
        {UI_COPY.feedReviewSuggestionsTitle}
      </Typography>
      {reviewSuggestionsLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Array.from({ length: FEED_REVIEW_SUGGESTION_SKELETON_COUNT }).map((_, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Skeleton variant='circular' width={24} height={24} />
              <Skeleton variant='text' width={120} height={20} />
            </Box>
          ))}
        </Box>
      ) : reviewSuggestions.length === 0 ? (
        <Typography variant='caption' color='text.secondary' sx={{ fontStyle: 'italic' }}>
          {UI_COPY.feedReviewSuggestionsEmpty}
        </Typography>
      ) : (
        <ReviewSuggestionRows reviewSuggestions={reviewSuggestions} />
      )}
    </Box>
  )
}

export function MobileFeedReviewSuggestions({
  reviewSuggestions,
  reviewSuggestionsLoading,
}: FeedReviewSuggestionsProps) {
  return (
    <MobileReviewSuggestionsPanel>
      <MobileReviewSuggestionsTitle variant='body2'>
        {UI_COPY.feedReviewSuggestionsTitle}
      </MobileReviewSuggestionsTitle>
      {reviewSuggestionsLoading ? (
        <MobileReviewSuggestionsSkeletonRow>
          {Array.from({ length: FEED_REVIEW_SUGGESTION_SKELETON_COUNT }).map((_, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Skeleton variant='circular' width={24} height={24} />
              <Skeleton variant='text' width={80} height={20} />
            </Box>
          ))}
        </MobileReviewSuggestionsSkeletonRow>
      ) : reviewSuggestions.length === 0 ? (
        <Typography variant='caption' color='text.secondary' sx={{ fontStyle: 'italic' }}>
          {UI_COPY.feedReviewSuggestionsEmpty}
        </Typography>
      ) : (
        <ReviewSuggestionMobileRows reviewSuggestions={reviewSuggestions} />
      )}
    </MobileReviewSuggestionsPanel>
  )
}
