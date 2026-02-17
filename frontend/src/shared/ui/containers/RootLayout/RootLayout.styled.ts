import { Box, styled } from '@mui/material'

export const RootContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
})

export const SkipLink = styled('a')(({ theme }) => ({
  position: 'absolute',
  left: '-9999px',
  top: 'auto',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  zIndex: theme.zIndex.tooltip + 1,
  '&:focus': {
    position: 'fixed',
    top: 8,
    left: 8,
    width: 'auto',
    height: 'auto',
    padding: '8px 16px',
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: `2px solid ${theme.palette.primary.main}`,
    borderRadius: theme.shape.borderRadius,
    textDecoration: 'none',
    fontSize: '0.875rem',
  },
}))

export const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'component',
})<{ component?: React.ElementType }>({
  flexGrow: 1,
  paddingBottom: 40,
})
