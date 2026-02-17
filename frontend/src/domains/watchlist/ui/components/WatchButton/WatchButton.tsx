import { useState, useEffect } from 'react'
import { Button, CircularProgress, Skeleton, useTheme } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { usePostHog } from '@posthog/react'
import watchlistService from '@domains/watchlist/application/services/watchlistService'
import { getWatchedStyles, getUnwatchedStyles } from './WatchButton.styled'

interface WatchButtonProps {
  username: string
  initialWatched?: boolean
}

export default function WatchButton({ username, initialWatched }: WatchButtonProps) {
  const theme = useTheme()
  const posthog = usePostHog()
  const [isWatched, setIsWatching] = useState(initialWatched ?? false)
  const [initialLoading, setInitialLoading] = useState(initialWatched === undefined)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (initialWatched === undefined) {
      watchlistService
        .checkWatch(username)
        .then(setIsWatching)
        .finally(() => setInitialLoading(false))
    }
  }, [username, initialWatched])

  const handleClick = async () => {
    setActionLoading(true)
    try {
      if (isWatched) {
        await watchlistService.unwatch(username)
        posthog?.capture('user_unwatched', { watched_username: username })
        setIsWatching(false)
      } else {
        await watchlistService.watch(username)
        posthog?.capture('user_watched', { watched_username: username })
        setIsWatching(true)
      }
    } finally {
      setActionLoading(false)
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
