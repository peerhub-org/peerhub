interface UseInitialProfileLoadingOptions {
  profileUsername: string
  reviewersLoading: boolean
  myReviewsLoading: boolean
  shouldLoadMyReviews: boolean
}

export function useInitialProfileLoading(options: UseInitialProfileLoadingOptions) {
  const { reviewersLoading, myReviewsLoading, shouldLoadMyReviews } = options

  const isInitialProfileLoading = reviewersLoading || (shouldLoadMyReviews && myReviewsLoading)

  return { isInitialProfileLoading }
}
