import { Avatar, Box, styled } from '@mui/material'

export const AccountContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: 24,
})

export const ProfileAvatar = styled(Avatar)({
  width: 80,
  height: 80,
  marginBottom: 16,
})
