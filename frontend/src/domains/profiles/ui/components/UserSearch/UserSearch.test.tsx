import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserSearch from './UserSearch'
import { render } from '@test/utils'
import { UI_COPY } from '@shared/application/config/uiCopy'

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('UserSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(async () => {
    await act(async () => {
      vi.runOnlyPendingTimers()
    })
    vi.useRealTimers()
  })

  it('renders search trigger', async () => {
    await render(<UserSearch />)
    expect(screen.getByText(UI_COPY.searchUsersPlaceholder)).toBeInTheDocument()
  })

  it('opens search panel on click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await render(<UserSearch />)

    await user.click(screen.getByRole('combobox'))
    expect(screen.getByPlaceholderText(UI_COPY.searchUsersPlaceholder)).toBeInTheDocument()
  })

  it('closes search on Escape', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await render(<UserSearch />)

    await user.click(screen.getByRole('combobox'))
    expect(screen.getByPlaceholderText(UI_COPY.searchUsersPlaceholder)).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByPlaceholderText(UI_COPY.searchUsersPlaceholder)).not.toBeInTheDocument()
  })

  it('searches users after typing with debounce', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await render(<UserSearch />)

    await user.click(screen.getByRole('combobox'))
    const input = screen.getByPlaceholderText(UI_COPY.searchUsersPlaceholder)
    await user.type(input, 'test')

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    await waitFor(() => {
      expect(screen.getByText('test_user1')).toBeInTheDocument()
      expect(screen.getByText('test_user2')).toBeInTheDocument()
    })
  })

  it('navigates on result click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await render(<UserSearch />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByPlaceholderText(UI_COPY.searchUsersPlaceholder), 'ab')

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    await waitFor(() => {
      expect(screen.getByText('ab_user1')).toBeInTheDocument()
    })

    await user.click(screen.getByText('ab_user1'))
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/ab_user1')
    })
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(UI_COPY.searchUsersPlaceholder)).not.toBeInTheDocument()
    })
  })

  it('supports keyboard navigation with arrow keys and Enter', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await render(<UserSearch />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByPlaceholderText(UI_COPY.searchUsersPlaceholder), 'kb')

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    await waitFor(() => {
      expect(screen.getByText('kb_user1')).toBeInTheDocument()
    })

    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/kb_user1')
    })
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(UI_COPY.searchUsersPlaceholder)).not.toBeInTheDocument()
    })
  })
})
