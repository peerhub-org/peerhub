import { useState } from 'react'
import { Menu, MenuItem, Tooltip, Typography } from '@mui/material'
import { MoreHoriz, SpeakerNotesOff } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { Review } from '@domains/reviews/application/interfaces/Review'
import { Role } from '@shared/application/interfaces/Role'
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
  isCurrentUser?: boolean
  displayName: string
  isPageOwner?: boolean
  isModerator?: boolean
  pageOwnerUsername?: string
  onToggleHidden?: (reviewId: string, hidden: boolean, hiddenBy: Role | null) => void
}

export default function ReviewCommentCard({
  review,
  showAnonymous,
  isOwnAnonymousReview,
  isCurrentUser,
  displayName,
  isPageOwner,
  isModerator,
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
    const hiddenBy = !review.comment_hidden ? (isPageOwner ? Role.USER : Role.MODERATOR) : null
    onToggleHidden?.(review.id, !review.comment_hidden, hiddenBy)
    handleMenuClose()
  }

  if (!review.comment && !review.comment_hidden) return null

  // Determine visibility and actions based on who hid and who's viewing
  const hiddenByOwner = review.comment_hidden_by === Role.USER
  const hiddenByModerator = review.comment_hidden_by === Role.MODERATOR

  // Can the viewer see the comment text when hidden?
  const canSeeHiddenComment = (hiddenByOwner && isPageOwner) || (hiddenByModerator && isModerator)

  // Can the viewer unhide?
  const canUnhide = (hiddenByOwner && isPageOwner) || (hiddenByModerator && isModerator)

  // Should we show the menu (hide/unhide)?
  const canHide = isPageOwner || isModerator
  const showMenu = canHide && onToggleHidden && (!review.comment_hidden || canUnhide)

  // Hidden icon tooltip
  const hiddenIconTooltip = canSeeHiddenComment ? 'Comment hidden by you' : undefined

  return (
    <Card
      sx={isCurrentUser ? { borderLeft: `3px solid ${theme.palette.primary.main}` } : undefined}
    >
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
            <Tooltip title='Username is visible to you only' arrow>
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
          {review.comment_hidden && canSeeHiddenComment && hiddenIconTooltip && (
            <Tooltip title={hiddenIconTooltip} arrow>
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
        {showMenu && (
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
        {review.comment_hidden && !canSeeHiddenComment ? (
          <HiddenByOwnerText variant='body2'>
            {hiddenByModerator
              ? 'Abusive comment removed by moderation'
              : `Comment hidden by ${pageOwnerUsername}`}
          </HiddenByOwnerText>
        ) : review.comment_hidden && canSeeHiddenComment ? (
          <HiddenCommentText variant='body2'>{review.comment}</HiddenCommentText>
        ) : (
          <CommentText variant='body2'>{review.comment}</CommentText>
        )}
      </CardBody>
    </Card>
  )
}
