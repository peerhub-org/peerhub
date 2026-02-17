import { useState } from 'react'
import { CircularProgress, IconButton, Menu, MenuItem, Typography } from '@mui/material'
import { MoreHoriz } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { User } from '@domains/profiles/application/interfaces/User'
import { getMenuSlotProps } from '@shared/ui/foundations/theme'
import { AuthorAvatar, ExternalAvatarLink, NameLink } from './AuthorBioCard.styled'
import {
  Card,
  CardBody,
  CardHeader,
  TimelineItemContainer,
  TimelineContent,
  TimelineLine,
} from '@shared/ui/styled'

interface AuthorBioCardProps {
  user: User
  hasReviews: boolean
  isPageOwner?: boolean
  onRefresh?: () => void
}

export default function AuthorBioCard({
  user,
  hasReviews,
  isPageOwner,
  onRefresh,
}: AuthorBioCardProps) {
  const theme = useTheme()
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
  }

  const handleRefresh = async () => {
    handleMenuClose()
    setIsRefreshing(true)
    try {
      await onRefresh?.()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <TimelineItemContainer>
      {/* Avatar */}
      <ExternalAvatarLink
        href={`https://github.com/${user.username}`}
        target='_blank'
        rel='noopener noreferrer'
      >
        <AuthorAvatar src={user.avatar_url || undefined}>
          {user.username.charAt(0).toUpperCase()}
        </AuthorAvatar>
      </ExternalAvatarLink>

      {/* Content area with timeline */}
      <TimelineContent>
        {/* Timeline line - connects to first review status icon */}
        {hasReviews && <TimelineLine sx={{ left: 15, top: 0, bottom: -24 }} />}

        {/* Comment card - aligned with status icons, covers the line */}
        <Card>
          {/* Card header */}
          <CardHeader>
            <Typography variant='body2'>
              <NameLink
                href={`https://github.com/${user.username}`}
                target='_blank'
                rel='noopener noreferrer'
                underline='none'
              >
                {user.name || user.username}
              </NameLink>
            </Typography>
            {isPageOwner && onRefresh && (
              <>
                <IconButton
                  size='small'
                  onClick={handleMenuOpen}
                  sx={{ padding: '4px' }}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <CircularProgress size={18} />
                  ) : (
                    <MoreHoriz sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  slotProps={getMenuSlotProps(theme)}
                >
                  <MenuItem onClick={handleRefresh}>Refresh data</MenuItem>
                </Menu>
              </>
            )}
          </CardHeader>

          {/* Card body */}
          <CardBody>
            <Typography
              variant='body2'
              sx={{
                color: theme.palette.text.secondary,
                fontStyle: user.bio ? 'normal' : 'italic',
              }}
            >
              {user.bio || 'No bio is set'}
            </Typography>
          </CardBody>
        </Card>
      </TimelineContent>
    </TimelineItemContainer>
  )
}
