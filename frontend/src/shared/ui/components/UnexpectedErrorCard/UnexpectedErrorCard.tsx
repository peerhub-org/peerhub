import { Button, Typography } from '@mui/material'
import { Card, CardBody } from '@shared/ui/styled'

interface UnexpectedErrorCardProps {
  actionLabel?: string
  onAction?: () => void
}

export default function UnexpectedErrorCard({ actionLabel, onAction }: UnexpectedErrorCardProps) {
  return (
    <Card sx={{ minWidth: 280, maxWidth: 360, margin: 'auto' }}>
      <CardBody sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography component='div' sx={{ fontSize: '2rem', lineHeight: 1 }}>
          😕
        </Typography>
        <Typography variant='h6' component='h1'>
          Oops, something went wrong
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          An unexpected error occurred. Please try again in a moment.
        </Typography>
        {actionLabel && onAction && (
          <Button variant='contained' onClick={onAction} sx={{ mt: 1 }}>
            {actionLabel}
          </Button>
        )}
      </CardBody>
    </Card>
  )
}
