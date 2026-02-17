import { Component, ReactNode } from 'react'
import posthog from 'posthog-js'
import { Button, Typography } from '@mui/material'
import { ErrorContainer } from './ErrorBoundary.styled'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled error:', error, errorInfo)
    posthog.captureException(error)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <Typography variant='h4'>Something went wrong</Typography>
          <Typography variant='body1' color='text.secondary'>
            An unexpected error occurred. Please try reloading the page.
          </Typography>
          <Button variant='contained' onClick={this.handleReload} sx={{ mt: 2 }}>
            Reload page
          </Button>
        </ErrorContainer>
      )
    }

    return this.props.children
  }
}
