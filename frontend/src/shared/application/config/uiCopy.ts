export const OPEN_SOURCE_FOOTER_PREFIX = 'PeerHub is open source — help '
export const OPEN_SOURCE_FOOTER_LINK_TEXT = 'build it'
export const OPEN_SOURCE_FOOTER_SUFFIX = '.'

export const HOME_FEATURES = [
  {
    title: 'Genuine peer review',
    description:
      "Share meaningful feedback and positive recognition with developers you've actually worked with.",
  },
  {
    title: 'A reputation you own',
    description:
      'When AI can code too, your reputation is what sets you apart. Every review is proof of how you work, collaborate, and deliver.',
  },
  {
    title: 'Stand out to employers',
    description:
      'Build a profile that matters. Let your peer-verified track record speak for itself when companies come looking.',
  },
]

export const HOME_STEPS = [
  {
    number: '1',
    title: 'Connect your GitHub',
    description: 'One click to sign in. We only read your public profile.',
  },
  {
    number: '2',
    title: 'Review your peers',
    description: 'Approve, comment, or request changes. Just like a PR.',
  },
  {
    number: '3',
    title: 'Grow your reputation',
    description: 'Every review you give and receive builds your public profile.',
  },
]

export const REVIEW_STATUS_OPTIONS = [
  {
    value: 'comment' as const,
    label: 'Comment',
    description: 'Submit general feedback without explicit approval.',
  },
  {
    value: 'approve' as const,
    label: 'Approve',
    description: 'Submit feedback and approve as a peer.',
  },
  {
    value: 'request_change' as const,
    label: 'Request changes',
    description: 'Submit feedback suggesting changes.',
  },
]

export const UI_COPY = {
  feedTitle: 'Feed',
  feedReviewSuggestionsTitle: 'Up next for review',
  feedWatchlistTitle: 'Watching',
  feedSeeAll: 'See all',
  feedTabAll: 'All',
  feedTabMine: 'You',
  feedTabOthers: 'Others',
  feedLoadWatchlistError: 'Unable to load your watchlist right now.',
  feedLoadFeedError: 'Unable to load feed right now.',
  feedReviewSuggestionsEmpty: 'Follow people on GitHub to see suggestions here.',
  feedNoWatchlist: 'Your watchlist is empty.',
  feedNoActivity: 'No activity yet. Watch users to see their reviews here!',
  reviewersEmpty: 'No reviewers yet',
  endOfList: "You've reached the end",
  searchUsersPlaceholder: 'Search users...',
  searchUsersLabel: 'Search users',
  searchUsersNoResults: 'No users found',
  reviewFormEditTitle: 'Edit your review',
  reviewFormCreateTitle: 'Finish your review',
  reviewFormPlaceholder: 'Leave a comment',
  reviewFormAnonymous: 'Submit anonymously',
  reviewFormSubmit: 'Submit review',
  reviewFormUpdate: 'Update review',
  reviewFormValidationCommentRequired: "Comment is required for 'comment' status",
  reviewFormCancel: 'Cancel',
  homeWhyTitle: 'Built for developers by developers',
  homeHowTitle: 'How it works',
  homeReadyTitle: 'Your reputation starts here',
  homeLoginCta: 'Login with GitHub',
  homeAuthFailed: 'Authentication failed. Please try again.',
  homeLoginFailed: 'Failed to initiate login. Please try again.',
}
