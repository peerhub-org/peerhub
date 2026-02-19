import { Typography } from '@mui/material'
import Grid from '@mui/material/Grid'
import { usePostHog } from '@posthog/react'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Card, CardBody } from '@shared/ui/styled'
import { ErrorContainer } from './ErrorPage.styled'
import UnexpectedErrorCard from '@shared/ui/components/UnexpectedErrorCard/UnexpectedErrorCard'

interface Error {
  status: number
  statusText: string
  message: string
}

export default function ErrorPage() {
  const error = useRouteError() as Error
  const posthog = usePostHog()
  console.error(error)
  if (!isRouteErrorResponse(error)) {
    posthog?.captureException(error)
  }
  if (isRouteErrorResponse(error)) {
    return (
      <ErrorContainer
        container
        spacing={0}
        direction='column'
        alignItems='center'
        justifyContent='center'
      >
        <Grid size={3}>
          <Card sx={{ minWidth: 275, margin: 'auto' }}>
            <CardBody>
              <Typography variant='h1' component='div'>
                {error.status}
              </Typography>
              <Typography sx={{ mb: 1.5 }} color='text.secondary'>
                {error.statusText || error.message}
              </Typography>
              <Typography variant='body2'>
                {error.status === 404
                  ? 'Page not found'
                  : 'Sorry, an unexpected error has occurred.'}
              </Typography>
            </CardBody>
          </Card>
        </Grid>
      </ErrorContainer>
    )
  } else {
    return (
      <ErrorContainer
        container
        spacing={0}
        direction='column'
        alignItems='center'
        justifyContent='center'
      >
        <Grid size={3}>
          <UnexpectedErrorCard />
        </Grid>
      </ErrorContainer>
    )
  }
}
