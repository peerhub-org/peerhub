import { Avatar, Box, ListItem, Typography, styled } from '@mui/material'

export const PageWrapper = styled(Box)(({ theme }) => ({
  minHeight: '100%',
  marginLeft: 240,
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
  },
}))

export const MainContent = styled(Box)(({ theme }) => ({
  minHeight: '100%',
  paddingTop: theme.spacing(3),
}))

export const WatchlistPanel = styled(Box)(({ theme }) => ({
  position: 'fixed',
  left: 0,
  bottom: 0,
  width: 240,
  borderTop: `1px solid ${theme.palette.divider}`,
  borderRight: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(3),
  paddingTop: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  overflowY: 'auto',
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}))

export const ReviewSuggestionLink = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  textDecoration: 'none',
  color: 'inherit',
  '&:hover': {
    color: theme.palette.primary.main,
  },
})) as typeof Box

export const SmallAvatar = styled(Avatar)({
  width: 24,
  height: 24,
  fontSize: '0.7rem',
})

export const WatchListItem = styled(ListItem)(({ theme }) => ({
  textDecoration: 'none',
  color: 'inherit',
  borderRadius: theme.shape.borderRadius,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
})) as typeof ListItem

export const MobileReviewSuggestionsPanel = styled(Box)(({ theme }) => ({
  display: 'none',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.highlight,
  [theme.breakpoints.down('md')]: {
    display: 'block',
  },
}))

export const MobileReviewSuggestionsTitle = styled(Typography)({
  fontWeight: 500,
  marginBottom: 12,
})

export const MobileReviewSuggestionsSkeletonRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  overflowX: 'hidden',
  gap: theme.spacing(4),
}))

export const MobileReviewSuggestionsScrollContainer = styled(Box)({
  overflowX: 'auto',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
})

export const MobileReviewSuggestionsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(4),
  width: 'fit-content',
  margin: '0 auto',
}))

export const MobileReviewSuggestionLink = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  textDecoration: 'none',
  color: 'inherit',
  flexShrink: 0,
  '&:hover': {
    color: theme.palette.primary.main,
  },
})) as typeof Box

export const MobileReviewSuggestionAvatar = styled(Avatar)({
  width: 24,
  height: 24,
  fontSize: '0.7rem',
})
