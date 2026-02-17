interface ReviewLike {
  anonymous: boolean
  reviewer_username: string | null
  reviewer_avatar_url: string | null
}

interface CurrentUserInfo {
  username: string
  avatarUrl: string | null
}

export function getAnonymousReviewDisplay(
  review: ReviewLike,
  isCurrentUser: boolean,
  currentUserInfo?: CurrentUserInfo | null,
) {
  const isOwnAnonymousReview = review.anonymous && isCurrentUser
  const showAnonymous = review.anonymous && !isCurrentUser
  const displayName = showAnonymous
    ? 'anonymous'
    : isOwnAnonymousReview && currentUserInfo
      ? currentUserInfo.username
      : (review.reviewer_username ?? 'unknown')
  const avatarUrl =
    isOwnAnonymousReview && currentUserInfo ? currentUserInfo.avatarUrl : review.reviewer_avatar_url

  return { isOwnAnonymousReview, showAnonymous, displayName, avatarUrl }
}
