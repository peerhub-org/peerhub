import { redirect } from 'react-router'
import authService from '@domains/authentication/application/services/authenticationService'

export function requireAuth() {
  const token = authService.getToken()
  if (!token) {
    throw redirect('/')
  }
}
