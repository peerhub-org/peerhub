import { Box, styled } from '@mui/material'

export const LoaderContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: theme.palette.background.default,
  zIndex: theme.zIndex.modal + 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}))
