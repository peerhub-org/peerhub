export const queryKeys = {
  account: {
    all: ['account'] as const,
    me: () => [...queryKeys.account.all, 'me'] as const,
  },
  watchlist: {
    all: ['watchlist'] as const,
    list: () => [...queryKeys.watchlist.all, 'list'] as const,
    check: (username: string) => [...queryKeys.watchlist.all, 'check', username] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    list: (username: string, statusFilter?: string) =>
      [...queryKeys.reviews.all, 'list', username, { statusFilter }] as const,
    reviewers: (username: string) => [...queryKeys.reviews.all, 'reviewers', username] as const,
    myReviews: () => [...queryKeys.reviews.all, 'mine'] as const,
    suggestions: (limit?: number) => [...queryKeys.reviews.all, 'suggestions', { limit }] as const,
  },
  feed: {
    all: ['feed'] as const,
    list: (filter: string) => [...queryKeys.feed.all, 'list', filter] as const,
  },
}
