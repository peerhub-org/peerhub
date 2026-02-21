import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { SnackBarProvider } from '@shared/ui/hooks/useSnackbar'
import { ThemeModeProvider } from '@shared/ui/hooks/useThemeMode'
import { AccountScreen } from './Account'

vi.mock('@domains/authentication/application/hooks/useAuthentication', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    account: { username: 'testuser' },
    isLoading: false,
    setAccount: vi.fn(),
    refetchAccount: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock('@domains/profiles/application/services/profileService', () => ({
  default: {
    getUser: vi.fn().mockResolvedValue({
      username: 'testuser',
      name: 'Test User',
      bio: null,
      avatar_url: 'https://example.com/avatar.png',
      created_at: '2025-01-01T00:00:00Z',
      deleted_at: null,
    }),
  },
}))

vi.mock('@domains/account/application/services/accountService', () => ({
  default: {
    getAccount: vi.fn().mockResolvedValue({ username: 'testuser' }),
    deleteAccount: vi.fn().mockResolvedValue(undefined),
  },
}))

function renderAccountScreen() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  const router = createMemoryRouter([{ path: '/account', element: <AccountScreen /> }], {
    initialEntries: ['/account'],
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <SnackBarProvider>
          <RouterProvider router={router} />
        </SnackBarProvider>
      </ThemeModeProvider>
    </QueryClientProvider>,
  )
}

describe('Account screen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('token', 'test-token')
    localStorage.removeItem('theme-mode')
  })

  it('renders account settings page', async () => {
    renderAccountScreen()
    expect(await screen.findByText('@testuser')).toBeInTheDocument()
  })

  it('shows AccountDetails when account exists', async () => {
    renderAccountScreen()
    expect(await screen.findByText('@testuser')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeInTheDocument()
  })

  it('sets document title', async () => {
    renderAccountScreen()
    await screen.findByText('@testuser')
    expect(document.title).toBe('PeerHub - Account')
  })
})
