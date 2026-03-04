import { Box, styled } from '@mui/material'

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
  pointerEvents: 'none',
  userSelect: 'none',
})

export const PlaceholderAvatar = styled(Box)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: theme.palette.divider,
  flexShrink: 0,
}))

export const PlaceholderContent = styled(Box)({
  flex: 1,
  marginTop: 4,
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

export const DraftOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'start',
  paddingTop: 48,
  gap: 8,
  zIndex: 1,
  background: `linear-gradient(to bottom, ${theme.palette.background.default}20 0%, ${theme.palette.background.default}80 15%, ${theme.palette.background.default}cc 35%, ${theme.palette.background.default}d9 60%)`,
}))
