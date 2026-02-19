import { DarkMode, LightMode, Logout, Person, Settings } from '@mui/icons-material'
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Link,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import * as React from 'react'
import { NavLink, useNavigate } from 'react-router'
import { useAuth } from '@domains/authentication/application/hooks/useAuthentication'
import UserSearch from '@domains/profiles/ui/components/UserSearch/UserSearch'
import { getMenuSlotProps } from '@shared/ui/foundations/theme'
import { useThemeMode } from '@shared/ui/hooks/useThemeMode'
import { StyledAppBar, StyledToolbar } from './TopMenuBar.styled'

const logos = { dark: '/logo.png', light: '/logo_black.png' } as const

export default function TopMenuBar() {
  const theme = useTheme()
  const { mode, toggleTheme } = useThemeMode()
  const { account, logout } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    setAnchorEl(null)
    navigate('/')
  }

  return (
    <StyledAppBar position='static' elevation={0} aria-label='Main navigation'>
      <StyledToolbar>
        <Link
          component={NavLink}
          to='/feed'
          aria-label='PeerHub home'
          sx={{ lineHeight: 0, display: 'flex', textDecoration: 'none', color: 'inherit' }}
        >
          <img src={logos[mode]} alt='PeerHub Logo' style={{ height: 26, marginRight: 8 }} />
          <Typography variant='h6' sx={{ lineHeight: 1.3 }}>
            PeerHub
          </Typography>
        </Link>

        <Box sx={{ flexGrow: 1 }} />

        <UserSearch />

        <Box sx={{ ml: { xs: 0.5, sm: 2 } }} />

        <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
          <IconButton onClick={toggleTheme} color='inherit' size='small'>
            {mode === 'dark' ? <LightMode fontSize='small' /> : <DarkMode fontSize='small' />}
          </IconButton>
        </Tooltip>

        <Box sx={{ ml: 1 }} />

        <Tooltip title='Account settings'>
          <Avatar
            role='button'
            tabIndex={0}
            aria-label='Account menu'
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup='true'
            aria-expanded={open ? 'true' : undefined}
            onClick={handleClick}
            src={account ? `https://github.com/${account.username}.png` : undefined}
            sx={{
              width: 32,
              height: 32,
              border: `2px solid ${theme.palette.action.selected}`,
              cursor: 'pointer',
            }}
          />
        </Tooltip>
      </StyledToolbar>
      <Menu
        anchorEl={anchorEl}
        id='account-menu'
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: { ...getMenuSlotProps(theme).paper.sx, mt: '8px' },
          },
        }}
      >
        <Link
          component={NavLink}
          to={account ? `/${account.username}` : '/'}
          color='inherit'
          underline='none'
        >
          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <Person sx={{ fontSize: 16 }} />
            </ListItemIcon>
            Profile
          </MenuItem>
        </Link>
        <Link component={NavLink} to='/settings/account' color='inherit' underline='none'>
          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <Settings sx={{ fontSize: 16 }} />
            </ListItemIcon>
            Account
          </MenuItem>
        </Link>

        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout sx={{ fontSize: 16 }} />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </StyledAppBar>
  )
}
