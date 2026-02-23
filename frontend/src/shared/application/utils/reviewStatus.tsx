import { ChatBubbleOutline, Check, Rule } from '@mui/icons-material'
import { Theme } from '@mui/material/styles'
import { ReviewStatus } from '@shared/application/interfaces/ReviewStatus'
import { isLight } from '@shared/ui/foundations/theme'

export function getStatusColor(theme: Theme, status: ReviewStatus) {
  const statusColorMap = {
    approve: theme.palette.success.main,
    request_change: theme.palette.error.main,
    comment: theme.palette.background.grey,
  }
  return statusColorMap[status]
}

export function getStatusIcon(
  theme: Theme,
  status: ReviewStatus,
  colored: boolean = false,
  size: number = 16,
) {
  const color = colored
    ? status === 'comment'
      ? isLight(theme)
        ? theme.palette.grey[700]
        : theme.palette.grey[300]
      : getStatusColor(theme, status)
    : 'inherit'
  switch (status) {
    case 'approve':
      return <Check sx={{ fontSize: size, color }} />
    case 'request_change':
      return <Rule sx={{ fontSize: size, color }} />
    case 'comment':
      return <ChatBubbleOutline sx={{ fontSize: size, color }} />
  }
}

export function getStatusText(status: ReviewStatus) {
  switch (status) {
    case 'approve':
      return 'approved'
    case 'request_change':
      return 'requested changes'
    case 'comment':
      return 'reviewed'
  }
}
