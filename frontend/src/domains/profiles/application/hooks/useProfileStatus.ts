import { useCallback, useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { User } from '@domains/profiles/application/interfaces/User'
import profileService from '@domains/profiles/application/services/profileService'

export function useProfileStatus(initialUser: User, currentUsername: string | undefined) {
  const theme = useTheme()
  const [user, setUser] = useState<User>(initialUser)

  useEffect(() => {
    setUser(initialUser)
  }, [initialUser])

  const handleRefreshUser = useCallback(async () => {
    try {
      const refreshedUser = await profileService.refreshUser(user.username)
      setUser(refreshedUser)
    } catch {
      // Error handling
    }
  }, [user.username])

  const isPageOwner = currentUsername === user.username
  const isDraft = !user.created_at
  const isClosed = Boolean(user.deleted_at)

  const getStatusInfo = () => {
    if (!user.created_at) {
      return {
        label: 'Draft' as const,
        color: theme.palette.background.grey,
        message: 'awaits your feedback, shared once open',
      }
    }
    if (user.deleted_at) {
      return {
        label: 'Closed' as const,
        color: theme.palette.error.main,
        message: 'is closed to reviews',
      }
    }
    return {
      label: 'Open' as const,
      color: theme.palette.success.main,
      message: 'is open to reviews since',
    }
  }

  const statusInfo = getStatusInfo()

  return {
    user,
    isPageOwner,
    isDraft,
    isClosed,
    statusInfo,
    handleRefreshUser,
  }
}
