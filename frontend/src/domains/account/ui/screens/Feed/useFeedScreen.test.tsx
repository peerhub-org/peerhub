import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFeedScreen } from './useFeedScreen'
import { Account } from '@domains/account/application/interfaces/Account'

vi.mock('@domains/authentication/application/hooks/useAuthentication', () => ({
  useAuth: vi.fn(),
}))
vi.mock('@domains/account/application/hooks/useActivityFeed', () => ({
  useActivityFeed: vi.fn(),
}))
vi.mock('@domains/watchlist/application/hooks/useWatchlist', () => ({
  useWatchlist: vi.fn(),
}))
vi.mock('@domains/reviews/application/hooks/useReviewSuggestions', () => ({
  useReviewSuggestions: vi.fn(),
}))

import { useAuth } from '@domains/authentication/application/hooks/useAuthentication'
import { useActivityFeed } from '@domains/account/application/hooks/useActivityFeed'
import { useWatchlist } from '@domains/watchlist/application/hooks/useWatchlist'
import { useReviewSuggestions } from '@domains/reviews/application/hooks/useReviewSuggestions'

const mockedUseAuth = vi.mocked(useAuth)
const mockedUseActivityFeed = vi.mocked(useActivityFeed)
const mockedUseWatchlist = vi.mocked(useWatchlist)
const mockedUseReviewSuggestions = vi.mocked(useReviewSuggestions)

const loaderAccount: Account = { uuid: 'alice-uuid', username: 'alice' }

describe('useFeedScreen', () => {
  const mockSetAccount = vi.fn()
  const mockRefetchAccount = vi.fn()
  const mockLogout = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
    mockedUseAuth.mockReturnValue({
      account: undefined,
      isLoading: false,
      setAccount: mockSetAccount,
      refetchAccount: mockRefetchAccount,
      logout: mockLogout,
    })
    mockedUseActivityFeed.mockReturnValue({
      activeTab: 'all',
      feedItems: [],
      loading: false,
      loadingMore: false,
      hasMore: true,
      error: null,
      sentinelRef: { current: null },
      handleTabChange: vi.fn(),
    })
    mockedUseWatchlist.mockReturnValue({
      watchlist: [],
      watchlistLoading: false,
      error: null,
    })
    mockedUseReviewSuggestions.mockReturnValue({
      reviewSuggestions: [],
      reviewSuggestionsLoading: false,
      error: null,
    })
    document.title = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('hydrates auth account when missing', () => {
    renderHook(() => useFeedScreen(loaderAccount))
    expect(mockSetAccount).toHaveBeenCalledWith(loaderAccount)
  })

  it('does not overwrite auth account when already set', () => {
    mockedUseAuth.mockReturnValue({
      account: { ...loaderAccount, uuid: 'bob-uuid', username: 'bob' },
      isLoading: false,
      setAccount: mockSetAccount,
      refetchAccount: mockRefetchAccount,
      logout: mockLogout,
    })

    renderHook(() => useFeedScreen(loaderAccount))
    expect(mockSetAccount).not.toHaveBeenCalled()
  })

  it('sets feed page title', () => {
    renderHook(() => useFeedScreen(loaderAccount))
    expect(document.title).toBe('PeerHub - Feed')
  })
})
