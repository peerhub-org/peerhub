import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ThemeModeProvider } from '@shared/ui/hooks/useThemeMode'
import { UI_COPY } from '@shared/application/config/uiCopy'
import Feed from './Feed'
import { useFeedScreen } from './useFeedScreen'

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useLoaderData: vi.fn(() => ({ account: { username: 'testuser' } })),
  }
})

vi.mock('./useFeedScreen', () => ({
  useFeedScreen: vi.fn(),
}))

const mockedUseFeedScreen = vi.mocked(useFeedScreen)

const createBaseScreenState = () => ({
  watchlistModalOpen: false,
  setWatchlistModalOpen: vi.fn(),
  panelRef: { current: null },
  activeTab: 'all' as const,
  feedItems: [],
  loading: false,
  loadingMore: false,
  hasMore: false,
  feedError: null as Error | null,
  sentinelRef: { current: null },
  handleTabChange: vi.fn(),
  watchlist: Array.from({ length: 9 }).map((_, index) => ({
    id: `sub-${index}`,
    watched_username: `user${index}`,
    watched_avatar_url: null,
    watched_name: `User ${index}`,
    created_at: '2025-01-01T00:00:00Z',
  })),
  watchlistLoading: false,
  watchlistError: null as Error | null,
  reviewSuggestions: [],
  reviewSuggestionsLoading: false,
  reviewSuggestionsError: null as Error | null,
})

function renderFeed() {
  return render(
    <MemoryRouter>
      <ThemeModeProvider>
        <Feed />
      </ThemeModeProvider>
    </MemoryRouter>,
  )
}

describe('Feed screen', () => {
  beforeEach(() => {
    mockedUseFeedScreen.mockReturnValue(createBaseScreenState())
    localStorage.removeItem('theme-mode')
  })

  it('renders feed title and tabs', () => {
    renderFeed()

    expect(screen.getByText(UI_COPY.feedTitle)).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: UI_COPY.feedTabAll })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: UI_COPY.feedTabMine })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: UI_COPY.feedTabOthers })).toBeInTheDocument()
  })

  it('shows feed error message', () => {
    mockedUseFeedScreen.mockReturnValueOnce({
      ...createBaseScreenState(),
      feedError: new Error('boom'),
    })

    renderFeed()
    expect(screen.getByText(UI_COPY.feedLoadFeedError)).toBeInTheDocument()
  })

  it('opens watchlist modal when see all is clicked', async () => {
    const user = userEvent.setup()
    const setWatchlistModalOpen = vi.fn()
    mockedUseFeedScreen.mockReturnValueOnce({
      ...createBaseScreenState(),
      setWatchlistModalOpen,
    })

    renderFeed()

    await user.click(screen.getByRole('button', { name: UI_COPY.feedSeeAll }))
    expect(setWatchlistModalOpen).toHaveBeenCalledWith(true)
  })
})
