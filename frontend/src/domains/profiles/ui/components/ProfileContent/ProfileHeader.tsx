import { Link, Popover, Skeleton, Tooltip, Typography } from '@mui/material'
import { ArrowDropDown } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { Review } from '@domains/reviews/application/interfaces/Review'
import ReviewForm from '@domains/reviews/ui/components/ReviewForm/ReviewForm'
import { useReviewFormPopover } from '@domains/reviews/application/hooks/useReviewFormPopover'
import { timeAgo, formatFullDate } from '@shared/application/utils/dateFormatting'
import { HeaderRow, HeaderLeft, StatusChip, ReviewButton, ButtonRow } from './ProfileContent.styled'

interface ProfileHeaderProps {
  username: string
  createdAt: string | null
  statusInfo: { label: string; color: string; message: string }
  showSubmitButton: boolean
  isClosed: boolean
  hasExistingReview: boolean
  existingReview?: Review
  isLoading: boolean
  onSuccess: () => void
}

export default function ProfileHeader({
  username,
  createdAt,
  statusInfo,
  showSubmitButton,
  isClosed,
  hasExistingReview,
  existingReview,
  isLoading,
  onSuccess,
}: ProfileHeaderProps) {
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))
  const {
    anchorEl,
    isOpen: isReviewFormOpen,
    handleOpen: handleOpenReviewForm,
    handleClose: handleCloseReviewForm,
  } = useReviewFormPopover()

  return (
    <HeaderRow>
      <HeaderLeft>
        <StatusChip label={statusInfo.label} size='small' statusColor={statusInfo.color} />
        <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
          <Link
            href={`https://github.com/${username}`}
            target='_blank'
            rel='noopener noreferrer'
            underline='none'
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 600,
              '&:hover': { color: theme.palette.primary.main },
            }}
          >
            {username}
          </Link>
          {statusInfo.label === 'Open' && createdAt ? (
            <>
              {` ${statusInfo.message} `}
              <Tooltip title={formatFullDate(createdAt)} arrow>
                <span style={{ cursor: 'default' }}>{timeAgo(createdAt)}</span>
              </Tooltip>
            </>
          ) : (
            ` ${statusInfo.message}`
          )}
        </Typography>
      </HeaderLeft>
      {showSubmitButton && !isClosed && (
        <ButtonRow>
          {isLoading ? (
            <Skeleton variant='rounded' width={120} height={28} />
          ) : (
            <>
              <ReviewButton
                variant={hasExistingReview ? 'outlined' : 'contained'}
                onClick={handleOpenReviewForm}
                endIcon={<ArrowDropDown />}
                hasExistingReview={hasExistingReview}
              >
                {hasExistingReview
                  ? isSmallScreen
                    ? 'Edit'
                    : 'Edit review'
                  : isSmallScreen
                    ? 'Review'
                    : 'Submit review'}
              </ReviewButton>
              <Popover
                open={isReviewFormOpen}
                anchorEl={anchorEl}
                onClose={handleCloseReviewForm}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                  paper: {
                    sx: {
                      bgcolor: 'transparent',
                      boxShadow: 'none',
                      mt: 1,
                    },
                  },
                }}
              >
                <ReviewForm
                  key={existingReview ? `${existingReview.id}-${existingReview.updated_at}` : 'new'}
                  username={username}
                  onClose={handleCloseReviewForm}
                  onSuccess={onSuccess}
                  existingReview={existingReview}
                />
              </Popover>
            </>
          )}
        </ButtonRow>
      )}
    </HeaderRow>
  )
}
