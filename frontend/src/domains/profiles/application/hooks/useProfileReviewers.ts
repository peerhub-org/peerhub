import { useQuery } from '@tanstack/react-query'
import reviewService from '@domains/reviews/application/services/reviewService'
import { queryKeys } from '@shared/application/queryKeys'

export function useProfileReviewers(username: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.reviews.reviewers(username),
    queryFn: () => reviewService.getReviewers(username),
  })

  return {
    reviewers: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error : error ? new Error('An error occurred') : null,
    refetch: async () => {
      await refetch()
    },
  }
}
