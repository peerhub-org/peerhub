import { useMemo } from 'react'
import reviewService from '@domains/reviews/application/services/reviewService'
import { ReviewSuggestion } from '@domains/reviews/application/interfaces/Review'
import { useAsyncData } from '@shared/application/hooks/useAsyncData'

export function useReviewSuggestions(limit?: number) {
  const fetcher = useMemo(() => () => reviewService.getReviewSuggestions(limit), [limit])

  const {
    data: reviewSuggestions,
    loading: reviewSuggestionsLoading,
    error,
  } = useAsyncData<ReviewSuggestion[]>({
    fetcher,
    initialData: [],
  })

  return { reviewSuggestions, reviewSuggestionsLoading, error }
}
