import { ReactNode, useMemo } from 'react'
import { Box, Link, Typography } from '@mui/material'
import { GitHub } from '@mui/icons-material'
import { GitHubSignInButton } from '@shared/ui/styled'
import { NavLink } from 'react-router'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import TopMenuBar from '@shared/ui/components/TopMenuBar/TopMenuBar'
import { createAppTheme } from '@shared/ui/foundations/theme'
import { StyledAppBar, StyledToolbar } from '@shared/ui/components/TopMenuBar/TopMenuBar.styled'
import { RootContainer, SkipLink, MainContent } from '../RootLayout/RootLayout.styled'
import authService from '@domains/authentication/application/services/authenticationService'

function GuestMenuBar() {
  const handleSignIn = async () => {
    try {
      const oauthUrl = await authService.getGithubOAuthUrl()
      window.location.href = oauthUrl
    } catch {
      window.location.href = '/'
    }
  }

  return (
    <StyledAppBar position='static' elevation={0} aria-label='Main navigation'>
      <StyledToolbar>
        <Link
          component={NavLink}
          to='/'
          aria-label='PeerHub home'
          sx={{ lineHeight: 0, display: 'flex', textDecoration: 'none', color: 'inherit' }}
        >
          <img src='/logo_black.png' alt='PeerHub Logo' style={{ height: 26, marginRight: 8 }} />
          <Typography variant='h6' sx={{ lineHeight: 1.3 }}>
            PeerHub
          </Typography>
        </Link>

        <Box sx={{ flexGrow: 1 }} />

        <GitHubSignInButton
          variant='contained'
          size='small'
          startIcon={<GitHub />}
          onClick={handleSignIn}
        >
          Sign in with GitHub
        </GitHubSignInButton>
      </StyledToolbar>
    </StyledAppBar>
  )
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  const isAuthenticated = Boolean(authService.getToken())
  const lightTheme = useMemo(() => createAppTheme('light'), [])

  const content = (
    <RootContainer>
      <SkipLink href='#main-content'>Skip to main content</SkipLink>
      {isAuthenticated ? <TopMenuBar /> : <GuestMenuBar />}
      <MainContent component='main' id='main-content'>
        {children}
      </MainContent>
    </RootContainer>
  )

  if (isAuthenticated) return content

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      {content}
    </ThemeProvider>
  )
}
