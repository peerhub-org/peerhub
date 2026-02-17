import { useState } from 'react'
import { Menu, MenuItem, Tooltip, Typography } from '@mui/material'
import { MoreHoriz, SpeakerNotesOff } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { Review } from '@domains/reviews/application/interfaces/Review'
import { getMenuSlotProps } from '@shared/ui/foundations/theme'
import Incognito from '@shared/ui/components/icons/Incognito'
import {
  UsernameLink,
  CommentText,
  HiddenCommentText,
  HiddenByOwnerText,
  MenuIconButton,
  HiddenIconWrapper,
  OwnAnonymousWrapper,
} from './ReviewTimelineItem.styled'
import { Card, CardBody, CardHeader } from '@shared/ui/styled'

interface ReviewCommentCardProps {
  review: Review
  showAnonymous: boolean
  isOwnAnonymousReview: boolean
  displayName: string
  isPageOwner?: boolean
  pageOwnerUsername?: string
  onToggleHidden?: (reviewId: string, hidden: boolean) => void
}

export default function ReviewCommentCard({
  review,
  showAnonymous,
  isOwnAnonymousReview,
  displayName,
  isPageOwner,
  pageOwnerUsername,
  onToggleHidden,
}: ReviewCommentCardProps) {
  const theme = useTheme()
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
  }

  const handleToggleHidden = () => {
    onToggleHidden?.(review.id, !review.comment_hidden)
    handleMenuClose()
  }

  if (!review.comment && !review.comment_hidden) return null

  return (
    <Card>
      <CardHeader>
        <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
          {showAnonymous ? (
            <Typography
              component='span'
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              anonymous
            </Typography>
          ) : isOwnAnonymousReview ? (
            <Tooltip title='Visible to you only' arrow>
              <OwnAnonymousWrapper component='span' sx={{ display: 'inline-flex' }}>
                <Typography
                  component='span'
                  sx={{
                    color: theme.palette.text.disabled,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  {displayName}
                </Typography>
                <Incognito sx={{ color: theme.palette.text.disabled, fontSize: 14 }} />
              </OwnAnonymousWrapper>
            </Tooltip>
          ) : (
            <UsernameLink to={`/${review.reviewer_username}`}>{displayName}</UsernameLink>
          )}
          {' left a comment'}
          {review.comment_hidden && isPageOwner && (
            <Tooltip title='Comment hidden by you' arrow>
              <HiddenIconWrapper component='span'>
                <SpeakerNotesOff
                  sx={{
                    color: theme.palette.text.disabled,
                    fontSize: 14,
                    verticalAlign: 'middle',
                  }}
                />
              </HiddenIconWrapper>
            </Tooltip>
          )}
        </Typography>
        {isPageOwner && onToggleHidden && (
          <>
            <MenuIconButton size='small' onClick={handleMenuOpen}>
              <MoreHoriz sx={{ fontSize: 18 }} />
            </MenuIconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={getMenuSlotProps(theme)}
            >
              <MenuItem onClick={handleToggleHidden}>
                {review.comment_hidden ? 'Show comment' : 'Hide comment'}
              </MenuItem>
            </Menu>
          </>
        )}
      </CardHeader>

      <CardBody>
        {review.comment_hidden && !isPageOwner ? (
          <HiddenByOwnerText variant='body2'>
            Comment hidden by {pageOwnerUsername}
          </HiddenByOwnerText>
        ) : review.comment_hidden && isPageOwner ? (
          <HiddenCommentText variant='body2'>{review.comment}</HiddenCommentText>
        ) : (
          <CommentText variant='body2'>{review.comment}</CommentText>
        )}
      </CardBody>
    </Card>
  )
}
