import { useCallback } from 'react'
import authService from '@domains/authentication/application/services/authenticationService'

export function useGitHubSignIn() {
  return useCallback(async () => {
    try {
      const oauthUrl = await authService.getGithubOAuthUrl()
      window.location.href = oauthUrl
    } catch {
      window.location.href = '/'
    }
  }, [])
}
