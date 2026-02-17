import { Alert } from '@mui/material'

interface InlineErrorProps {
  message?: string
}

export default function InlineError({ message = 'Something went wrong.' }: InlineErrorProps) {
  return <Alert severity='error'>{message}</Alert>
}
