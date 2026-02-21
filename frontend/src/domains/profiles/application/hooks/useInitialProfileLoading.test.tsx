import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useInitialProfileLoading } from './useInitialProfileLoading'

describe('useInitialProfileLoading', () => {
  it('keeps initial loading true until first load completes for both sources', () => {
    const { result, rerender } = renderHook(
      ({ profileUsername, reviewersLoading, myReviewsLoading, shouldLoadMyReviews }) =>
        useInitialProfileLoading({
          profileUsername,
          reviewersLoading,
          myReviewsLoading,
          shouldLoadMyReviews,
        }),
      {
        initialProps: {
          profileUsername: 'alice',
          reviewersLoading: true,
          myReviewsLoading: true,
          shouldLoadMyReviews: true,
        },
      },
    )

    expect(result.current.isInitialProfileLoading).toBe(true)

    rerender({
      profileUsername: 'alice',
      reviewersLoading: false,
      myReviewsLoading: true,
      shouldLoadMyReviews: true,
    })
    expect(result.current.isInitialProfileLoading).toBe(true)

    rerender({
      profileUsername: 'alice',
      reviewersLoading: false,
      myReviewsLoading: false,
      shouldLoadMyReviews: true,
    })
    expect(result.current.isInitialProfileLoading).toBe(false)
  })

  it('is not loading when myReviews should not be fetched', () => {
    const { result } = renderHook(() =>
      useInitialProfileLoading({
        profileUsername: 'alice',
        reviewersLoading: false,
        myReviewsLoading: false,
        shouldLoadMyReviews: false,
      }),
    )

    expect(result.current.isInitialProfileLoading).toBe(false)
  })

  it('is loading when switching to a profile with no cached data', () => {
    const { result, rerender } = renderHook(
      ({ profileUsername, reviewersLoading, myReviewsLoading, shouldLoadMyReviews }) =>
        useInitialProfileLoading({
          profileUsername,
          reviewersLoading,
          myReviewsLoading,
          shouldLoadMyReviews,
        }),
      {
        initialProps: {
          profileUsername: 'alice',
          reviewersLoading: false,
          myReviewsLoading: false,
          shouldLoadMyReviews: false,
        },
      },
    )

    expect(result.current.isInitialProfileLoading).toBe(false)

    rerender({
      profileUsername: 'bob',
      reviewersLoading: true,
      myReviewsLoading: true,
      shouldLoadMyReviews: true,
    })

    expect(result.current.isInitialProfileLoading).toBe(true)
  })
})
