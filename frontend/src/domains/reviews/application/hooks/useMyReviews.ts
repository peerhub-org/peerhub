import { useCallback, useEffect, useState } from 'react'
import reviewService from '@domains/reviews/application/services/reviewService'
import { Review } from '@domains/reviews/application/interfaces/Review'

export function useMyReviews(
  currentUsername: string | undefined,
  initialMyReviewIds: Set<string> | undefined,
  profileUsername: string,
) {
  const [myReviewIds, setMyReviewIds] = useState<Set<string>>(initialMyReviewIds ?? new Set())
  const [myReviewsLoading, setMyReviewsLoading] = useState(!initialMyReviewIds && !!currentUsername)
  const [currentUserInfo, setCurrentUserInfo] = useState<{
    username: string
    avatarUrl: string | null
  } | null>(null)
  const [existingReview, setExistingReview] = useState<Review | undefined>()
  const [refreshCounter, setRefreshCounter] = useState(0)

  const refetchMyReviews = useCallback(() => {
    setRefreshCounter((c) => c + 1)
  }, [])

  useEffect(() => {
    let isActive = true

    if (currentUsername && !initialMyReviewIds) {
      Promise.resolve().then(() => {
        if (isActive) {
          setMyReviewsLoading(true)
        }
      })
      reviewService
        .getMyReviews()
        .then((myReviews) => {
          if (!isActive) return
          setMyReviewIds(new Set(myReviews.map((r) => r.id)))
          const match = myReviews.find(
            (r) => r.reviewed_username.toLowerCase() === profileUsername.toLowerCase(),
          )
          if (match) {
            setExistingReview(match)
          } else {
            setExistingReview(undefined)
          }
          if (myReviews.length > 0 && myReviews[0].reviewer_username) {
            setCurrentUserInfo({
              username: myReviews[0].reviewer_username,
              avatarUrl: myReviews[0].reviewer_avatar_url,
            })
          } else {
            setCurrentUserInfo(null)
          }
        })
        .catch(() => {
          if (!isActive) return
          setMyReviewIds(new Set())
          setExistingReview(undefined)
          setCurrentUserInfo(null)
        })
        .finally(() => {
          if (!isActive) return
          setMyReviewsLoading(false)
        })
    }

    return () => {
      isActive = false
    }
  }, [currentUsername, initialMyReviewIds, profileUsername, refreshCounter])

  return {
    myReviewIds,
    myReviewsLoading,
    currentUserInfo,
    existingReview,
    refetchMyReviews,
  }
}
