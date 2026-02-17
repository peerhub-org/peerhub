import { useEffect } from 'react'
import { Box, Container } from '@mui/material'
import Grid from '@mui/material/Grid'
import AccountDetails from '@domains/account/ui/components/AccountDetails/AccountDetails'
import { useAuth } from '@domains/authentication/application/hooks/useAuthentication'
import { AccountCard } from './Account.styled'

export function AccountScreen() {
  const { account } = useAuth()

  useEffect(() => {
    document.title = 'PeerHub - Account'
  }, [])

  return (
    <Box>
      <Container maxWidth='lg' sx={{ pt: 4, pb: 4 }}>
        <Grid container spacing={2} justifyContent='center'>
          <Grid size={{ xs: 12, md: 7, lg: 5 }}>
            <AccountCard>{account && <AccountDetails account={account} />}</AccountCard>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
