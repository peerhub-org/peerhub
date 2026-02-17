import { Badge, Box, Button, Chip, styled } from '@mui/material'

export const HeaderRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
})

export const HeaderLeft = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  paddingRight: 8,
  gap: 16,
})

export const StatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'statusColor',
})<{ statusColor: string }>(({ statusColor }) => ({
  backgroundColor: statusColor,
  fontWeight: 600,
  fontSize: '0.875rem',
  height: 28,
  paddingLeft: 4,
  paddingRight: 4,
}))

export const TabsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.divider}`,
  marginBottom: 24,
}))

export const ReviewButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'hasExistingReview',
})<{ hasExistingReview?: boolean }>(({ theme, hasExistingReview }) => ({
  backgroundColor: hasExistingReview
    ? theme.palette.background.default
    : theme.palette.success.main,
  border: hasExistingReview ? `1px solid ${theme.palette.divider}` : 'none',
  '&:hover': {
    backgroundColor: hasExistingReview ? theme.palette.action.hover : theme.palette.success.light,
  },
  color: theme.palette.text.primary,
  fontWeight: 600,
  fontSize: '0.75rem',
  padding: '3px 12px',
  height: '28px',
}))

export const MainContent = styled(Box)({
  display: 'flex',
  gap: 32,
})

export const TimelinePanel = styled(Box)({
  flex: 1,
  minWidth: 0,
})

export const SidebarPanel = styled(Box)(({ theme }) => ({
  width: 240,
  flexShrink: 0,
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}))

export const TabBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.background.highlight,
    fontSize: '0.7rem',
    height: 18,
    minWidth: 18,
  },
}))

export const TabLabelWrapper = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
})

export const ButtonRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
})
