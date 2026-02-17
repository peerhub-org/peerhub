import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AccountDetails from './AccountDetails'
import { render } from '@test/utils'

const mockNavigate = vi.fn()
const mockLogout = vi.fn()
const mockGetUser = vi.fn().mockResolvedValue({ avatar_url: null })

vi.mock('@domains/profiles/application/services/profileService', () => ({
  default: { getUser: (...args: unknown[]) => mockGetUser(...args) },
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@domains/authentication/application/hooks/useAuthentication', async () => {
  const actual = await vi.importActual(
    '@domains/authentication/application/hooks/useAuthentication',
  )
  return {
    ...actual,
    useAuth: () => ({
      account: { uuid: 'test-uuid', username: 'testuser' },
      isLoading: false,
      setAccount: vi.fn(),
      refetchAccount: vi.fn(),
      logout: mockLogout,
    }),
  }
})

const testAccount = { uuid: 'test-uuid', username: 'testuser' }

describe('AccountDetails', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ avatar_url: null })
  })

  it('renders username', async () => {
    await render(<AccountDetails account={testAccount} />)
    expect(screen.getByText('@testuser')).toBeInTheDocument()
  })

  it('renders avatar with first letter', async () => {
    await render(<AccountDetails account={testAccount} />)
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('shows delete account button', async () => {
    await render(<AccountDetails account={testAccount} />)
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeInTheDocument()
  })

  it('opens confirmation dialog on delete click', async () => {
    const user = userEvent.setup()
    await render(<AccountDetails account={testAccount} />)

    await user.click(screen.getByRole('button', { name: 'Delete account' }))
    expect(screen.getByText('Are you sure you want to delete your account?')).toBeInTheDocument()
  })

  it('calls service and logout on confirm delete', async () => {
    const user = userEvent.setup()
    await render(<AccountDetails account={testAccount} />)

    await user.click(screen.getByRole('button', { name: 'Delete account' }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup()
    await render(<AccountDetails account={testAccount} />)

    await user.click(screen.getByRole('button', { name: 'Delete account' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(
        screen.queryByText('Are you sure you want to delete your account?'),
      ).not.toBeInTheDocument()
    })
  })
})
