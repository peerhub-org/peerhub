import { Avatar, Box, IconButton, Typography, styled } from '@mui/material'
import { UsernameLink as SharedUsernameLink } from '@shared/ui/styled'

export { TimelineItemContainer as ItemContainer } from '@shared/ui/styled'
export { TimelineContent as ContentArea } from '@shared/ui/styled'
export { StatusCircle } from '@shared/ui/styled'
export { AvatarLink } from '@shared/ui/styled'
export { OwnAnonymousWrapper } from '@shared/ui/styled'

export const TimelineLine = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: 15,
  width: 2,
  backgroundColor: theme.palette.divider,
  zIndex: 0,
}))

export const EventHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
  marginTop: 4,
})

export const AnonymousAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.palette.divider,
  flexShrink: 0,
}))

export const OwnAnonymousAvatar = styled(Avatar)({
  width: 40,
  height: 40,
  fontSize: '0.875rem',
  flexShrink: 0,
  filter: 'grayscale(100%)',
  opacity: 0.7,
})

export const StandardAvatar = styled(Avatar)({
  width: 40,
  height: 40,
  fontSize: '0.875rem',
})

export const AnonymousText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 600,
  fontSize: '0.875rem',
}))

export const OwnAnonymousText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  fontWeight: 600,
  fontSize: '0.875rem',
}))

export const UsernameLink = styled(SharedUsernameLink)({
  fontSize: '0.875rem',
})

export const StatusText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  lineHeight: 1.5,
}))

export const CommentText = styled(Typography)({
  whiteSpace: 'pre-wrap',
})

export const HiddenCommentText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  whiteSpace: 'pre-wrap',
  textDecoration: 'line-through',
}))

export const HiddenByOwnerText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontStyle: 'italic',
}))

export const MenuIconButton = styled(IconButton)({
  padding: 4,
})

export const HiddenIconWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'component',
})<{ component?: React.ElementType }>({
  display: 'inline-flex',
  alignItems: 'center',
  verticalAlign: 'middle',
  marginLeft: 4,
})
