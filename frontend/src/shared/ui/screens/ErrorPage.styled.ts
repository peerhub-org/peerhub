import Grid from '@mui/material/Grid'
import { styled } from '@mui/material'

export const ErrorContainer = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  minHeight: '100vh',
}))
