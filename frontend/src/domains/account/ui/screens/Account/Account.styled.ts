import { styled } from '@mui/material'
import { Card } from '@shared/ui/styled'

export const AccountCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
}))
