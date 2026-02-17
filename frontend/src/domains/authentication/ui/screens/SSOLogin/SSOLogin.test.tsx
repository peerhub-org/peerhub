import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ThemeProvider } from '@mui/material/styles'
import theme from '@shared/ui/foundations/theme'
import SSOLogin from './SSOLogin'

const mockNavigate = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockExchangeCodeForToken = vi.fn()
const mockStoreToken = vi.fn()

vi.mock('@domains/authentication/application/services/authenticationService', () => ({
  default: {
    exchangeCodeForToken: (...args: unknown[]) => mockExchangeCodeForToken(...args),
    storeToken: (...args: unknown[]) => mockStoreToken(...args),
  },
}))

function renderSSOLogin(searchParams = '') {
  return render(
    <MemoryRouter initialEntries={[`/auth/callback${searchParams}`]}>
      <ThemeProvider theme={theme}>
        <SSOLogin />
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('SSOLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows loading spinner', () => {
    mockExchangeCodeForToken.mockReturnValue(new Promise(() => {})) // never resolves
    renderSSOLogin('?code=test-code')
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('exchanges code for token and redirects on success', async () => {
    mockExchangeCodeForToken.mockResolvedValue('jwt-token-123')

    renderSSOLogin('?code=test-code')

    await waitFor(() => {
      expect(mockExchangeCodeForToken).toHaveBeenCalledWith('test-code')
      expect(mockStoreToken).toHaveBeenCalledWith('jwt-token-123')
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  it('redirects with error state when no code present', async () => {
    renderSSOLogin('')

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true, state: { authError: true } })
    })
  })

  it('redirects with error state when OAuth error param present', async () => {
    renderSSOLogin('?error=access_denied')

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true, state: { authError: true } })
    })
  })

  it('redirects with error state on exchange failure', async () => {
    mockExchangeCodeForToken.mockRejectedValue(new Error('Exchange failed'))

    renderSSOLogin('?code=bad-code')

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true, state: { authError: true } })
    })
  })
})
