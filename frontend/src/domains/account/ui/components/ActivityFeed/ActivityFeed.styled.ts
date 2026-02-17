import { Box, Paper, styled } from '@mui/material'
import { Link } from 'react-router'

export const FeedItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  backgroundImage: 'none',
}))

export const FeedItemRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
}))

export const CommentCard = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.background.highlight,
  borderRadius: theme.shape.borderRadius,
}))

export const Content = styled(Box)({
  flex: 1,
  minWidth: 0,
})

export const FeedLink = styled(Link)(({ theme }) => ({
  color: theme.palette.text.primary,
  textDecoration: 'none',
  '&:hover': {
    color: theme.palette.primary.main,
  },
}))

export const StatusCircle = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'statusColor',
})<{ statusColor: string }>(({ statusColor, theme }) => ({
  width: 24,
  height: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: statusColor,
  borderRadius: '50%',
  border: `2px solid ${theme.palette.background.default}`,
}))
