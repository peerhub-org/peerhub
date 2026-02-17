import { useCallback } from 'react'
import reviewService from '@domains/reviews/application/services/reviewService'
import { ReviewerSummary } from '@domains/reviews/application/interfaces/Review'
import { useAsyncData } from '@shared/application/hooks/useAsyncData'

export function useProfileReviewers(username: string) {
  const fetcher = useCallback(() => reviewService.getReviewers(username), [username])

  const {
    data: reviewers,
    loading,
    error,
    refetch,
  } = useAsyncData<ReviewerSummary[]>({
    fetcher,
    initialData: [],
  })

  return { reviewers, loading, error, refetch }
}
