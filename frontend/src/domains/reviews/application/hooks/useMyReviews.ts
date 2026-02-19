import { useCallback, useEffect, useReducer, useState } from 'react'
import reviewService from '@domains/reviews/application/services/reviewService'
import { Review } from '@domains/reviews/application/interfaces/Review'

interface MyReviewsRequestState {
  fetchIdentity: string | null
  refreshCounter: number
  loading: boolean
}

type MyReviewsRequestAction =
  | {
      type: 'sync_identity'
      fetchIdentity: string | null
    }
  | {
      type: 'refetch'
    }
  | {
      type: 'complete'
    }

function createInitialRequestState(fetchIdentity: string | null): MyReviewsRequestState {
  return {
    fetchIdentity,
    refreshCounter: 0,
    loading: Boolean(fetchIdentity),
  }
}

function myReviewsRequestReducer(
  state: MyReviewsRequestState,
  action: MyReviewsRequestAction,
): MyReviewsRequestState {
  switch (action.type) {
    case 'sync_identity':
      if (state.fetchIdentity === action.fetchIdentity) {
        return state
      }
      return {
        fetchIdentity: action.fetchIdentity,
        refreshCounter: 0,
        loading: Boolean(action.fetchIdentity),
      }
    case 'refetch':
      if (!state.fetchIdentity) {
        return state
      }
      return { ...state, refreshCounter: state.refreshCounter + 1, loading: true }
    case 'complete':
      if (!state.loading) {
        return state
      }
      return { ...state, loading: false }
    default:
      return state
  }
}

export function useMyReviews(
  currentUsername: string | undefined,
  initialMyReviewIds: Set<string> | undefined,
  profileUsername: string,
) {
  const [myReviewIds, setMyReviewIds] = useState<Set<string>>(initialMyReviewIds ?? new Set())
  const shouldFetchMyReviews = Boolean(currentUsername && !initialMyReviewIds)
  const fetchIdentity = shouldFetchMyReviews ? `${currentUsername}:${profileUsername}` : null
  const [requestState, dispatchRequest] = useReducer(
    myReviewsRequestReducer,
    fetchIdentity,
    createInitialRequestState,
  )
  const [currentUserInfo, setCurrentUserInfo] = useState<{
    username: string
    avatarUrl: string | null
  } | null>(null)
  const [existingReview, setExistingReview] = useState<Review | undefined>()

  useEffect(() => {
    dispatchRequest({ type: 'sync_identity', fetchIdentity })
  }, [fetchIdentity])

  const refetchMyReviews = useCallback(() => {
    dispatchRequest({ type: 'refetch' })
  }, [])

  const requestKey = requestState.fetchIdentity
    ? `${requestState.fetchIdentity}:${requestState.refreshCounter}`
    : null
  const myReviewsLoading = requestState.loading

  useEffect(() => {
    let isActive = true

    if (!requestKey) return () => void (isActive = false)

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
        dispatchRequest({ type: 'complete' })
      })

    return () => {
      isActive = false
    }
  }, [profileUsername, requestKey])

  return {
    myReviewIds,
    myReviewsLoading,
    currentUserInfo,
    existingReview,
    refetchMyReviews,
  }
}
