import { AppBar, Toolbar, styled } from '@mui/material'

export const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  backgroundImage: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
}))

export const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  padding: `0 ${theme.spacing(3)} !important`,
}))
