import { Component, ReactNode } from 'react'
import posthog from 'posthog-js'
import { ErrorContainer } from './ErrorBoundary.styled'
import UnexpectedErrorCard from '@shared/ui/components/UnexpectedErrorCard/UnexpectedErrorCard'

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
          <UnexpectedErrorCard actionLabel='Reload page' onAction={this.handleReload} />
        </ErrorContainer>
      )
    }

    return this.props.children
  }
}
