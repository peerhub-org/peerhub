import { useQuery } from '@tanstack/react-query'
import reviewService from '@domains/reviews/application/services/reviewService'
import { queryKeys } from '@shared/application/queryKeys'

export function useReviewSuggestions(limit?: number) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.reviews.suggestions(limit),
    queryFn: () => reviewService.getReviewSuggestions(limit),
  })

  return {
    reviewSuggestions: data ?? [],
    reviewSuggestionsLoading: isLoading,
    error: error instanceof Error ? error : error ? new Error('An error occurred') : null,
  }
}
