export const OPEN_SOURCE_FOOTER_PREFIX = 'PeerHub is open source — help '
export const OPEN_SOURCE_FOOTER_LINK_TEXT = 'build it'
export const OPEN_SOURCE_FOOTER_SUFFIX = '.'

export const HOME_FEATURES = [
  {
    title: 'Trusted review workflow',
    description: 'Review peers using the same PR-style workflow you already use every day.',
  },
  {
    title: 'Anonymous when it matters',
    description: 'Attach your name or stay anonymous when honest feedback needs extra safety.',
  },
  {
    title: 'Built by peers',
    description: 'Earn your reputation through a transparent trail of candid feedback.',
  },
]

export const HOME_STEPS = [
  {
    number: '1',
    title: 'Connect your GitHub',
    description:
      'One click to sign in. We only request read-only access to your public GitHub profile.',
  },
  {
    number: '2',
    title: 'Check your reputation',
    description:
      'Uncover how peers rate you and get honest feedback that doesn’t always surface at work.',
  },
  {
    number: '3',
    title: 'Review back',
    description: 'Approve, comment, or request changes. Optional anonymous mode available.',
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
  homeWhyTitle: 'Why PeerHub',
  homeHowTitle: 'How it works',
  homeReadyTitle: 'Ready to get started?',
  homeReadyDescription: 'Join the first peer driven developer review network.',
  homeLoginCta: 'Sign in with GitHub',
  homeAuthFailed: 'Authentication failed. Please try again.',
  homeLoginFailed: 'Failed to initiate login. Please try again.',
  feedFirstReviewModalTitle: 'Submit your first review',
  feedFirstReviewModalSubtitle:
    'Choose someone you follow on GitHub and leave your first peer review.',
}
