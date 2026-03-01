import { Box, Button, keyframes, styled } from '@mui/material'
import { Link } from 'react-router'

// Common flex layouts
export const FlexRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
})

export const FlexColumn = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
})

export const FlexRowBetween = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
})

export const FlexCenter = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

// Timeline components
export const TimelineLine = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: 2,
  backgroundColor: theme.palette.divider,
  zIndex: 0,
}))

// Status circle for timeline
export const StatusCircle = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'statusColor',
})<{ statusColor: string }>(({ statusColor, theme }) => ({
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: statusColor,
  color: theme.palette.getContrastText(statusColor),
  borderRadius: '50%',
  zIndex: 1,
  position: 'relative',
}))

// Small status dot
export const StatusDot = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'statusColor',
})<{ statusColor: string }>(({ statusColor }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: statusColor,
}))

// Card components
export const Card = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 6,
  position: 'relative',
  zIndex: 1,
  backgroundColor: theme.palette.background.default,
}))

export const CardHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 16px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}))

export const CardBody = styled(Box)({
  padding: 16,
})

// Container for timeline items
export const TimelineItemContainer = styled(Box)({
  display: 'flex',
  gap: 16,
  position: 'relative',
  marginBottom: 24,
})

// Content area for timeline items
export const TimelineContent = styled(Box)({
  flex: 1,
  minWidth: 0,
  position: 'relative',
})

// Avatar link (react-router)
export const AvatarLink = styled(Link)({
  textDecoration: 'none',
  flexShrink: 0,
})

// Username link with hover effect
export const UsernameLink = styled(Link)(({ theme }) => ({
  color: theme.palette.text.primary,
  textDecoration: 'none',
  '&:hover': {
    color: theme.palette.primary.main,
  },
  fontWeight: 600,
}))

// Wrapper for own anonymous review elements
export const OwnAnonymousWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'component',
})<{ component?: React.ElementType }>({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
})

//Common styles for buttons
export const SecondaryButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: 'none',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}))

export const DeleteButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(theme.palette.error.main),
  backgroundColor: theme.palette.error.main,
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: theme.palette.error.light,
    boxShadow: 'none',
  },
}))

const gradientShift = keyframes`
  0% { background-position: 0% center; }
  50% { background-position: 100% center; }
  100% { background-position: 0% center; }
`

export const GitHubSignInButton = styled(Button)({
  textTransform: 'none',
  color: '#fff',
  fontWeight: 600,
  padding: '6px 16px',
  borderRadius: 8,
  backgroundImage: 'linear-gradient(135deg, #5a6078, #818CF8, #c084c4, #F472B6, #818CF8, #5a6078)',
  backgroundSize: '300% 100%',
  animation: `${gradientShift} 6s ease infinite`,
  boxShadow: '0 1px 3px rgba(129,140,248,0.15)',
  transition: 'box-shadow 0.25s ease, filter 0.25s ease',
  '&:hover': {
    animationPlayState: 'paused',
    backgroundImage: 'linear-gradient(135deg, #818CF8, #F472B6)',
    backgroundSize: '100% 100%',
    boxShadow: '0 4px 16px rgba(129,140,248,0.3), 0 2px 6px rgba(244,114,182,0.2)',
    filter: 'brightness(1.1)',
  },
  '&:active': {
    filter: 'brightness(0.95)',
    boxShadow: '0 1px 2px rgba(129,140,248,0.2)',
  },
})
