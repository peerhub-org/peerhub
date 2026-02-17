import reviewService from '@domains/reviews/application/services/reviewService'
import { ReviewSuggestion } from '@domains/reviews/application/interfaces/Review'
import { useAsyncData } from '@shared/application/hooks/useAsyncData'

const fetchReviewSuggestions = () => reviewService.getReviewSuggestions()

export function useReviewSuggestions() {
  const {
    data: reviewSuggestions,
    loading: reviewSuggestionsLoading,
    error,
  } = useAsyncData<ReviewSuggestion[]>({
    fetcher: fetchReviewSuggestions,
    initialData: [],
  })

  return { reviewSuggestions, reviewSuggestionsLoading, error }
}
