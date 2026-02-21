import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import reviewService from '@domains/reviews/application/services/reviewService'
import { Review } from '@domains/reviews/application/interfaces/Review'
import { queryKeys } from '@shared/application/queryKeys'

export function useMyReviews(
  currentUsername: string | undefined,
  initialMyReviewIds: Set<string> | undefined,
  profileUsername: string,
) {
  const shouldFetchMyReviews = Boolean(currentUsername && !initialMyReviewIds)
  const queryClient = useQueryClient()
  const { data: myReviews, isLoading: myReviewsLoading } = useQuery({
    queryKey: queryKeys.reviews.myReviews(),
    queryFn: () => reviewService.getMyReviews(),
    enabled: shouldFetchMyReviews,
  })

  const myReviewIds = useMemo(() => {
    if (initialMyReviewIds) {
      return initialMyReviewIds
    }
    if (!myReviews) {
      return new Set<string>()
    }
    return new Set(myReviews.map((review) => review.id))
  }, [initialMyReviewIds, myReviews])

  const existingReview = useMemo<Review | undefined>(() => {
    if (!myReviews) {
      return undefined
    }
    return myReviews.find(
      (review) => review.reviewed_username.toLowerCase() === profileUsername.toLowerCase(),
    )
  }, [myReviews, profileUsername])

  const currentUserInfo = useMemo<{ username: string; avatarUrl: string | null } | null>(() => {
    if (!myReviews || myReviews.length === 0 || !myReviews[0].reviewer_username) {
      return null
    }
    return {
      username: myReviews[0].reviewer_username,
      avatarUrl: myReviews[0].reviewer_avatar_url,
    }
  }, [myReviews])

  const refetchMyReviews = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.myReviews() })
  }, [queryClient])

  return {
    myReviewIds,
    myReviewsLoading,
    currentUserInfo,
    existingReview,
    refetchMyReviews,
  }
}
