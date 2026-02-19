import { useEffect, useReducer } from 'react'

interface UseInitialProfileLoadingOptions {
  profileUsername: string
  reviewersLoading: boolean
  myReviewsLoading: boolean
  shouldLoadMyReviews: boolean
}

interface LoadingState {
  profileUsername: string
  reviewersStarted: boolean
  reviewersLoaded: boolean
  myReviewsStarted: boolean
  myReviewsLoaded: boolean
}

type LoadingAction =
  | {
      type: 'sync_profile'
      options: UseInitialProfileLoadingOptions
    }
  | {
      type: 'reviewers_started'
      profileUsername: string
    }
  | {
      type: 'reviewers_loaded'
      profileUsername: string
    }
  | {
      type: 'my_reviews_skipped'
      profileUsername: string
    }
  | {
      type: 'my_reviews_started'
      profileUsername: string
    }
  | {
      type: 'my_reviews_loaded'
      profileUsername: string
    }

function createInitialState({
  profileUsername,
  reviewersLoading,
  myReviewsLoading,
  shouldLoadMyReviews,
}: UseInitialProfileLoadingOptions): LoadingState {
  return {
    profileUsername,
    reviewersStarted: reviewersLoading,
    reviewersLoaded: false,
    myReviewsStarted: shouldLoadMyReviews ? myReviewsLoading : true,
    myReviewsLoaded: !shouldLoadMyReviews,
  }
}

function loadingStateReducer(state: LoadingState, action: LoadingAction): LoadingState {
  switch (action.type) {
    case 'sync_profile':
      if (state.profileUsername === action.options.profileUsername) {
        return state
      }
      return createInitialState(action.options)
    case 'reviewers_started':
      if (state.profileUsername !== action.profileUsername || state.reviewersStarted) {
        return state
      }
      return { ...state, reviewersStarted: true }
    case 'reviewers_loaded':
      if (
        state.profileUsername !== action.profileUsername ||
        !state.reviewersStarted ||
        state.reviewersLoaded
      ) {
        return state
      }
      return { ...state, reviewersLoaded: true }
    case 'my_reviews_skipped':
      if (state.profileUsername !== action.profileUsername || state.myReviewsLoaded) {
        return state
      }
      return { ...state, myReviewsStarted: true, myReviewsLoaded: true }
    case 'my_reviews_started':
      if (state.profileUsername !== action.profileUsername || state.myReviewsStarted) {
        return state
      }
      return { ...state, myReviewsStarted: true }
    case 'my_reviews_loaded':
      if (
        state.profileUsername !== action.profileUsername ||
        !state.myReviewsStarted ||
        state.myReviewsLoaded
      ) {
        return state
      }
      return { ...state, myReviewsLoaded: true }
    default:
      return state
  }
}

export function useInitialProfileLoading(options: UseInitialProfileLoadingOptions) {
  const { profileUsername, reviewersLoading, myReviewsLoading, shouldLoadMyReviews } = options
  const [state, dispatch] = useReducer(loadingStateReducer, options, createInitialState)

  useEffect(() => {
    dispatch({
      type: 'sync_profile',
      options: {
        profileUsername,
        reviewersLoading,
        myReviewsLoading,
        shouldLoadMyReviews,
      },
    })
  }, [myReviewsLoading, profileUsername, reviewersLoading, shouldLoadMyReviews])

  useEffect(() => {
    if (!reviewersLoading) return
    dispatch({ type: 'reviewers_started', profileUsername })
  }, [profileUsername, reviewersLoading])

  useEffect(() => {
    if (reviewersLoading) return
    dispatch({ type: 'reviewers_loaded', profileUsername })
  }, [profileUsername, reviewersLoading])

  useEffect(() => {
    if (shouldLoadMyReviews) return
    dispatch({ type: 'my_reviews_skipped', profileUsername })
  }, [profileUsername, shouldLoadMyReviews])

  useEffect(() => {
    if (!shouldLoadMyReviews || !myReviewsLoading) return
    dispatch({ type: 'my_reviews_started', profileUsername })
  }, [myReviewsLoading, profileUsername, shouldLoadMyReviews])

  useEffect(() => {
    if (!shouldLoadMyReviews || myReviewsLoading) return
    dispatch({ type: 'my_reviews_loaded', profileUsername })
  }, [myReviewsLoading, profileUsername, shouldLoadMyReviews])

  const isCurrentProfileState = state.profileUsername === profileUsername
  const isInitialProfileLoading =
    !isCurrentProfileState || !state.reviewersLoaded || !state.myReviewsLoaded

  return { isInitialProfileLoading }
}
