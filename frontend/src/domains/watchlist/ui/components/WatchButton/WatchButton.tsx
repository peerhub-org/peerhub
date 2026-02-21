import { Button, CircularProgress, Skeleton, useTheme } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { usePostHog } from '@posthog/react'
import { useWatchButton } from '@domains/watchlist/application/hooks/useWatchButton'
import { getWatchedStyles, getUnwatchedStyles } from './WatchButton.styled'

interface WatchButtonProps {
  username: string
  initialWatched?: boolean
}

export default function WatchButton({ username, initialWatched }: WatchButtonProps) {
  const theme = useTheme()
  const posthog = usePostHog()
  const { isWatched, initialLoading, actionLoading, toggleWatch } = useWatchButton(
    username,
    initialWatched,
  )

  const handleClick = async () => {
    try {
      const nextWatched = await toggleWatch()
      if (nextWatched) {
        posthog?.capture('user_watched', { watched_username: username })
      } else {
        posthog?.capture('user_unwatched', { watched_username: username })
      }
    } catch {
      // Error state is surfaced by preserving the last successful query value.
    }
  }

  const watchedStyles = getWatchedStyles(theme)
  const unwatchedStyles = getUnwatchedStyles(theme)

  if (initialLoading) {
    return <Skeleton variant='rounded' width='100%' height={32} />
  }

  return (
    <Button
      variant={isWatched ? 'outlined' : 'contained'}
      fullWidth
      startIcon={actionLoading ? undefined : isWatched ? <VisibilityOff /> : <Visibility />}
      onClick={handleClick}
      disabled={actionLoading}
      sx={isWatched ? watchedStyles : unwatchedStyles}
    >
      {actionLoading ? (
        <CircularProgress size={16} color='inherit' />
      ) : isWatched ? (
        'Unwatch'
      ) : (
        'Watch'
      )}
    </Button>
  )
}
