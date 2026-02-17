import { Avatar, Box, IconButton, Typography, styled } from '@mui/material'
import { UsernameLink as SharedUsernameLink } from '@shared/ui/styled'

export { AvatarLink } from '@shared/ui/styled'
export { StatusDot } from '@shared/ui/styled'
export { OwnAnonymousWrapper } from '@shared/ui/styled'

export const SidebarHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
})

export const HeaderTitle = styled(Typography)({
  fontWeight: 500,
})

export const StatsRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
})

export const ApproveCount = styled(Typography)(({ theme }) => ({
  color: theme.palette.success.main,
  fontWeight: 600,
}))

export const ChangeCount = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  fontWeight: 600,
}))

export const CirclesContainer = styled(Box)({
  display: 'flex',
  gap: 2,
  marginLeft: 4,
})

export const ReviewersList = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
})

export const ReviewerRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
})

export const ReviewerInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
})

export const AnonymousAvatar = styled(Avatar)(({ theme }) => ({
  width: 20,
  height: 20,
  backgroundColor: theme.palette.divider,
}))

export const OwnAnonymousAvatar = styled(Avatar)({
  width: 20,
  height: 20,
  fontSize: '0.65rem',
  filter: 'grayscale(100%)',
  opacity: 0.7,
})

export const StandardAvatar = styled(Avatar)({
  width: 20,
  height: 20,
  fontSize: '0.65rem',
})

export const AnonymousText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
}))

export const OwnAnonymousText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  fontSize: '0.75rem',
}))

export const UsernameLink = styled(SharedUsernameLink)({
  fontSize: '0.75rem',
  '&:hover': {
    textDecoration: 'none',
  },
})

export const ActionsRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
})

export const DeleteIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  padding: 2,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}))

export const EmptyText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontStyle: 'italic',
}))

export const ReviewerRowSkeleton = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
})
