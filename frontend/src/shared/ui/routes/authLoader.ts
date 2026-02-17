import { redirect } from 'react-router'

export function requireAuth() {
  const token = localStorage.getItem('token')
  if (!token) {
    throw redirect('/')
  }
}
