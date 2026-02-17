import { Avatar, Link, styled } from '@mui/material'

export const AuthorAvatar = styled(Avatar)({
  width: 40,
  height: 40,
  fontSize: '0.875rem',
})

// MUI Link variant for external URLs (different from shared AvatarLink which uses react-router Link)
export const ExternalAvatarLink = styled(Link)({
  textDecoration: 'none',
  flexShrink: 0,
})

export const NameLink = styled(Link)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: 600,
  '&:hover': {
    color: theme.palette.primary.main,
  },
}))
