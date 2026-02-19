import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useInitialProfileLoading } from './useInitialProfileLoading'

describe('useInitialProfileLoading', () => {
  it('keeps initial loading true until first load completes for both sources', async () => {
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

    await waitFor(() => {
      expect(result.current.isInitialProfileLoading).toBe(false)
    })
  })

  it('does not return to initial loading during same-profile refetches', async () => {
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

    rerender({
      profileUsername: 'alice',
      reviewersLoading: false,
      myReviewsLoading: false,
      shouldLoadMyReviews: true,
    })

    await waitFor(() => {
      expect(result.current.isInitialProfileLoading).toBe(false)
    })

    rerender({
      profileUsername: 'alice',
      reviewersLoading: true,
      myReviewsLoading: false,
      shouldLoadMyReviews: true,
    })

    expect(result.current.isInitialProfileLoading).toBe(false)
  })

  it('returns to initial loading immediately on profile switch', async () => {
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
          myReviewsLoading: false,
          shouldLoadMyReviews: false,
        },
      },
    )

    rerender({
      profileUsername: 'alice',
      reviewersLoading: false,
      myReviewsLoading: false,
      shouldLoadMyReviews: false,
    })

    await waitFor(() => {
      expect(result.current.isInitialProfileLoading).toBe(false)
    })

    rerender({
      profileUsername: 'bob',
      reviewersLoading: false,
      myReviewsLoading: false,
      shouldLoadMyReviews: true,
    })

    expect(result.current.isInitialProfileLoading).toBe(true)
  })
})
