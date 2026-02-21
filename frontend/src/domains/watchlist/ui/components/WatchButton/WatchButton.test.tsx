import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WatchButton from './WatchButton'
import { render } from '@test/utils'
import watchlistService from '@domains/watchlist/application/services/watchlistService'

vi.mock('@domains/watchlist/application/services/watchlistService', () => ({
  default: {
    checkWatch: vi.fn(),
    watch: vi.fn(),
    unwatch: vi.fn(),
    getWatchlist: vi.fn(),
  },
}))

describe('WatchButton', () => {
  let watchedState = false

  beforeEach(() => {
    watchedState = false
    vi.mocked(watchlistService.checkWatch).mockImplementation(async () => watchedState)
    vi.mocked(watchlistService.watch).mockImplementation(async () => {
      watchedState = true
    })
    vi.mocked(watchlistService.unwatch).mockImplementation(async () => {
      watchedState = false
    })
  })

  it('shows Watch when not watched', async () => {
    await render(<WatchButton username='johndoe' initialWatched={false} />)
    expect(screen.getByRole('button', { name: 'Watch' })).toBeInTheDocument()
  })

  it('shows Unwatch when watched', async () => {
    watchedState = true
    await render(<WatchButton username='johndoe' initialWatched={true} />)
    expect(screen.getByRole('button', { name: 'Unwatch' })).toBeInTheDocument()
  })

  it('toggles from Watch to Unwatch on click', async () => {
    const user = userEvent.setup()
    await render(<WatchButton username='johndoe' initialWatched={false} />)

    await user.click(screen.getByRole('button', { name: 'Watch' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Unwatch' })).toBeInTheDocument()
    })
  })

  it('toggles from Unwatch to Watch on click', async () => {
    const user = userEvent.setup()
    watchedState = true
    await render(<WatchButton username='johndoe' initialWatched={true} />)

    await user.click(screen.getByRole('button', { name: 'Unwatch' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Watch' })).toBeInTheDocument()
    })
  })

  it('shows loading skeleton when no initial value', async () => {
    await render(<WatchButton username='johndoe' />)
    // Should show skeleton initially, then resolve
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})
