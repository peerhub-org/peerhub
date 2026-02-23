import { AppBar, Toolbar, styled } from '@mui/material'
import { isLight } from '@shared/ui/foundations/theme'

export const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: isLight(theme)
    ? theme.palette.background.paper
    : theme.palette.background.default,
  color: theme.palette.text.primary,
  backgroundImage: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
}))

export const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  padding: `0 ${theme.spacing(3)} !important`,
}))
