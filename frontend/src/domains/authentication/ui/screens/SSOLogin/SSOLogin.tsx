import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { CircularProgress } from '@mui/material'
import { usePostHog } from '@posthog/react'
import authService from '@domains/authentication/application/services/authenticationService'
import accountService from '@domains/account/application/services/accountService'
import { LoaderContainer } from './SSOLogin.styled'

/**
 * Handles the OAuth callback. Shows a loading spinner while exchanging
 * the code for a token, then redirects to home.
 */
export default function SSOLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const posthog = usePostHog()
  const isProcessing = useRef(false)

  useEffect(() => {
    // Prevent duplicate calls (React Strict Mode runs effects twice)
    if (isProcessing.current) return
    isProcessing.current = true

    const handleOAuthCallback = async () => {
      const code = searchParams.get('code')
      const error = searchParams.get('error')

      // Handle OAuth error from GitHub
      if (error) {
        posthog?.capture('login_failed', { provider: 'github', reason: 'oauth_error' })
        navigate('/', { replace: true, state: { authError: true } })
        return
      }

      // No code means invalid callback
      if (!code) {
        posthog?.capture('login_failed', { provider: 'github', reason: 'missing_code' })
        navigate('/', { replace: true, state: { authError: true } })
        return
      }

      try {
        // Exchange code for token via backend
        const token = await authService.exchangeCodeForToken(code)
        authService.storeToken(token)

        // Identify user after successful login
        try {
          const account = await accountService.getAccount()
          posthog?.identify(account.uuid)
          posthog?.capture('login_completed', { provider: 'github' })
        } catch {
          // Still capture login even if account fetch fails
          posthog?.capture('login_completed', { provider: 'github' })
        }

        navigate('/', { replace: true })
      } catch {
        // Handle exchange failure
        posthog?.capture('login_failed', { provider: 'github', reason: 'token_exchange_failed' })
        navigate('/', { replace: true, state: { authError: true } })
      }
    }

    handleOAuthCallback()
  }, [navigate, searchParams, posthog])

  return (
    <LoaderContainer>
      <CircularProgress sx={{ color: 'grey.500' }} />
    </LoaderContainer>
  )
}
