import { useState } from 'react'
import { usePostHog } from '@posthog/react'
import reviewService from '@domains/reviews/application/services/reviewService'
import { Review, ReviewStatus } from '@domains/reviews/application/interfaces/Review'
import { getErrorMessage } from '@shared/application/api/errors'
import { REVIEW_MAX_COMMENT_LENGTH } from '@shared/application/config/appConstants'
import { UI_COPY } from '@shared/application/config/uiCopy'

interface UseReviewFormLogicParams {
  username: string
  existingReview?: Review
}

export function useReviewFormLogic({ username, existingReview }: UseReviewFormLogicParams) {
  const [status, setStatus] = useState<ReviewStatus>(existingReview?.status ?? 'comment')
  const [comment, setComment] = useState(existingReview?.comment ?? '')
  const [anonymous, setAnonymous] = useState(existingReview?.anonymous ?? false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const posthog = usePostHog()

  const isEditing = Boolean(existingReview)

  const submitReview = async () => {
    setError(null)

    if (status === 'comment' && !comment.trim()) {
      setError(UI_COPY.reviewFormValidationCommentRequired)
      return false
    }

    setLoading(true)
    try {
      await reviewService.createReview({
        reviewed_username: username,
        status,
        comment: comment.trim() || null,
        anonymous,
      })

      const eventName = isEditing ? 'review_updated' : 'review_submitted'
      posthog?.capture(eventName, {
        reviewed_username: username,
        status,
        anonymous,
        has_comment: Boolean(comment.trim()),
      })

      return true
    } catch (submissionError: unknown) {
      setError(getErrorMessage(submissionError))
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    status,
    setStatus,
    comment,
    setComment,
    anonymous,
    setAnonymous,
    error,
    loading,
    isEditing,
    maxCommentLength: REVIEW_MAX_COMMENT_LENGTH,
    submitReview,
  }
}
