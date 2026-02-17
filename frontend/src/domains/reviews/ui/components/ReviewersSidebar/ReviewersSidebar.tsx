import {
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material'
import { Close, Delete } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { ReviewerSummary } from '@domains/reviews/application/interfaces/Review'
import { getStatusIcon } from '@shared/application/utils/reviewStatus'
import { getAnonymousReviewDisplay } from '@shared/application/utils/anonymousReview'
import Incognito from '@shared/ui/components/icons/Incognito'
import WatchButton from '@domains/watchlist/ui/components/WatchButton/WatchButton'
import {
  SidebarHeader,
  HeaderTitle,
  StatsRow,
  ApproveCount,
  ChangeCount,
  CirclesContainer,
  StatusDot,
  ReviewersList,
  ReviewerRow,
  ReviewerInfo,
  AnonymousAvatar,
  OwnAnonymousAvatar,
  StandardAvatar,
  AvatarLink,
  AnonymousText,
  OwnAnonymousText,
  UsernameLink,
  ActionsRow,
  DeleteIconButton,
  EmptyText,
  OwnAnonymousWrapper,
  ReviewerRowSkeleton,
} from './ReviewersSidebar.styled'
import { SecondaryButton, DeleteButton } from '@shared/ui/styled'
import { UI_COPY } from '@shared/application/config/uiCopy'
import OpenSourceFooter from '@shared/ui/components/OpenSourceFooter/OpenSourceFooter'
import { useReviewersSidebarModel } from './useReviewersSidebarModel'
import { useReviewContext } from '@domains/reviews/ui/context/ReviewContext'

interface ReviewersSidebarProps {
  reviewers: ReviewerSummary[]
  loading?: boolean
  onDeleteSuccess?: () => void
}

export default function ReviewersSidebar({
  reviewers,
  loading = false,
  onDeleteSuccess,
}: ReviewersSidebarProps) {
  const theme = useTheme()
  const { myReviewIds, currentUserInfo, profileUsername, isPageOwner, isDraft } = useReviewContext()
  const {
    deleting,
    deleteTarget,
    seeAllOpen,
    setSeeAllOpen,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    sortedReviews,
    approveCount,
    changeCount,
    totalCount,
    circleColors,
    visibleReviews,
    hasMoreReviewers,
  } = useReviewersSidebarModel({ reviewers, myReviewIds, onDeleteSuccess })

  const renderReviewerRow = (review: ReviewerSummary, inModal = false) => {
    const isOwnReview = myReviewIds.has(review.id)
    const { isOwnAnonymousReview, showAnonymous, displayName, avatarUrl } =
      getAnonymousReviewDisplay(review, isOwnReview, currentUserInfo)

    const statusIcon = getStatusIcon(theme, review.status, true)

    return (
      <ReviewerRow key={review.id}>
        <ReviewerInfo>
          {showAnonymous ? (
            <AnonymousAvatar>
              <Incognito sx={{ color: theme.palette.text.secondary, fontSize: 14 }} />
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
          {inModal && statusIcon}
        </ReviewerInfo>
        {!inModal && (
          <ActionsRow>
            {isOwnReview && (
              <DeleteIconButton
                size='small'
                onClick={() => handleDeleteClick(review.reviewed_username)}
                disabled={deleting}
              >
                <Delete sx={{ fontSize: 14 }} />
              </DeleteIconButton>
            )}
            {statusIcon}
          </ActionsRow>
        )}
      </ReviewerRow>
    )
  }

  return (
    <div>
      {/* Header */}
      <SidebarHeader>
        <HeaderTitle variant='body2'>Reviewers</HeaderTitle>
        <StatsRow>
          {approveCount > 0 && <ApproveCount variant='caption'>+{approveCount}</ApproveCount>}
          {changeCount > 0 && <ChangeCount variant='caption'>-{changeCount}</ChangeCount>}
          {totalCount > 0 && (
            <CirclesContainer>
              {circleColors.map((color, index) => (
                <StatusDot key={index} statusColor={color} />
              ))}
            </CirclesContainer>
          )}
        </StatsRow>
      </SidebarHeader>

      {/* Reviewers list */}
      {loading ? (
        <ReviewersList>
          {/* Reviewer rows skeleton */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <ReviewerRowSkeleton key={i}>
              <ReviewerInfo>
                <Skeleton variant='circular' width={20} height={20} />
                <Skeleton variant='text' width={80} height={16} />
              </ReviewerInfo>
              <Skeleton variant='circular' width={16} height={16} />
            </ReviewerRowSkeleton>
          ))}
          <Skeleton variant='rounded' width='100%' height={24} sx={{ mt: 2 }} />
        </ReviewersList>
      ) : reviewers.length === 0 && !isDraft ? (
        <EmptyText variant='body2'>{UI_COPY.reviewersEmpty}</EmptyText>
      ) : (
        <>
          <ReviewersList>
            {visibleReviews.map((review) => renderReviewerRow(review))}
            {isDraft && !isPageOwner && (
              <Tooltip
                title={`Other users' reviews will be shown when ${profileUsername} is open to reviews`}
                arrow
                placement='left'
              >
                <ReviewerRow sx={{ opacity: 0.5, cursor: 'help' }}>
                  <ReviewerInfo>
                    <AnonymousAvatar></AnonymousAvatar>
                    <Box sx={{ width: 80, height: 12, bgcolor: 'divider', borderRadius: 1 }} />
                  </ReviewerInfo>
                  <ActionsRow>
                    <Box sx={{ width: 16, height: 16, bgcolor: 'divider', borderRadius: '50%' }} />
                  </ActionsRow>
                </ReviewerRow>
              </Tooltip>
            )}
          </ReviewersList>
          {hasMoreReviewers && (
            <SecondaryButton
              fullWidth
              size='small'
              onClick={() => setSeeAllOpen(true)}
              sx={{ mt: 1.5, fontSize: '0.75rem' }}
            >
              See all
            </SecondaryButton>
          )}
        </>
      )}

      {/* Watch button */}
      {profileUsername && (
        <Box sx={{ mt: 2, pt: isPageOwner ? 0 : 2, borderTop: 1, borderColor: 'divider' }}>
          {!isPageOwner && <WatchButton username={profileUsername} />}
          <OpenSourceFooter
            variant='caption'
            sx={{ display: 'block', mt: 2, textAlign: 'center' }}
          />
        </Box>
      )}

      {/* All reviewers modal */}
      <Dialog
        open={seeAllOpen}
        onClose={() => setSeeAllOpen(false)}
        fullWidth
        maxWidth='xs'
        slotProps={{ paper: { sx: { bgcolor: 'background.default' } } }}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}
        >
          <Typography variant='body1' fontWeight={600}>
            Reviewers
          </Typography>
          <IconButton size='small' onClick={() => setSeeAllOpen(false)}>
            <Close fontSize='small' />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 2 }}>
          <ReviewersList>
            {sortedReviews.map((review) => renderReviewerRow(review, true))}
          </ReviewersList>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation modal */}
      <Dialog
        open={deleteTarget !== null}
        onClose={handleDeleteCancel}
        slotProps={{ paper: { sx: { bgcolor: 'background.default' } } }}
      >
        <DialogTitle>Delete review</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete your review?</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <SecondaryButton onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </SecondaryButton>
          <DeleteButton
            onClick={handleDeleteConfirm}
            disabled={deleting}
            variant='contained'
            sx={{ minWidth: 80 }}
          >
            {deleting ? <CircularProgress size={24} color='inherit' /> : 'Delete'}
          </DeleteButton>
        </DialogActions>
      </Dialog>
    </div>
  )
}
