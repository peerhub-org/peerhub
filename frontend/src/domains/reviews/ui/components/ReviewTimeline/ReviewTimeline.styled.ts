import { Avatar, Box, styled } from '@mui/material'

export const EmptyStateContainer = styled(Box)({
  textAlign: 'center',
  paddingTop: 32,
  paddingBottom: 32,
})

export const DraftPlaceholderContainer = styled(Box)({
  position: 'relative',
  marginTop: 8,
})

export const DraftPlaceholderContent = styled(Box)({
  display: 'flex',
  gap: 16,
  marginBottom: 24,
  opacity: 0.3,
  filter: 'blur(2px)',
  pointerEvents: 'none',
  userSelect: 'none',
})

export const PlaceholderAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.palette.divider,
}))

export const PlaceholderContent = styled(Box)({
  flex: 1,
})

export const PlaceholderHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
})

export const PlaceholderStatusCircle = styled(Box)(({ theme }) => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  backgroundColor: theme.palette.divider,
}))

export const PlaceholderCard = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 6,
  overflow: 'hidden',
}))

export const PlaceholderCardHeader = styled(Box)(({ theme }) => ({
  padding: '8px 16px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.divider,
  height: 36,
}))

export const PlaceholderCardBody = styled(Box)({
  padding: 16,
  height: 60,
})

export const DraftOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  zIndex: 1,
})
