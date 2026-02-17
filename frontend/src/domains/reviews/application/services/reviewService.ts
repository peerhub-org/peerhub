import axios from 'axios'
import {
  Review,
  ReviewerSummary,
  CreateReviewRequest,
  PaginatedReviews,
  ReviewSuggestion,
} from '@domains/reviews/application/interfaces/Review'
import { API_BASE_URL } from '@shared/application/config/env'
import { PAGE_SIZE } from '@shared/application/config/appConstants'
import { z } from 'zod'
import { reviewStatusSchema } from '@shared/application/schemas/reviewSchemas'

const reviewSchema = z.object({
  id: z.string(),
  reviewer_uuid: z.string().nullable(),
  reviewer_username: z.string().nullable(),
  reviewer_avatar_url: z.string().nullable(),
  reviewed_username: z.string(),
  status: reviewStatusSchema,
  comment: z.string().nullable(),
  anonymous: z.boolean(),
  comment_hidden: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

const reviewerSummarySchema = z.object({
  id: z.string(),
  reviewer_uuid: z.string().nullable(),
  reviewer_username: z.string().nullable(),
  reviewer_avatar_url: z.string().nullable(),
  reviewed_username: z.string(),
  status: reviewStatusSchema,
  anonymous: z.boolean(),
  updated_at: z.string(),
})

const paginatedReviewsSchema = z
  .object({
    items: z.array(reviewSchema),
    has_more: z.boolean(),
  })
  .passthrough()

const reviewSuggestionSchema = z.object({
  username: z.string(),
  avatar_url: z.string().nullable(),
})

class ReviewService {
  async getReviews(
    username: string,
    limit: number = PAGE_SIZE,
    offset: number = 0,
    status?: string,
  ): Promise<PaginatedReviews> {
    const params: Record<string, string | number> = { limit, offset }
    if (status) params.status = status
    const response = await axios.get(API_BASE_URL + `reviews/${username}`, { params })
    return paginatedReviewsSchema.parse(response.data)
  }

  async getReviewers(username: string): Promise<ReviewerSummary[]> {
    const response = await axios.get(API_BASE_URL + `reviews/${username}/reviewers`)
    return z.array(reviewerSummarySchema).parse(response.data)
  }

  async getReviewSuggestions(): Promise<ReviewSuggestion[]> {
    const response = await axios.get(API_BASE_URL + 'reviews/suggestions')
    return z.array(reviewSuggestionSchema).parse(response.data)
  }

  async getMyReviews(): Promise<Review[]> {
    const response = await axios.get(API_BASE_URL + 'account/reviews')
    return z.array(reviewSchema).parse(response.data)
  }

  async createReview(request: CreateReviewRequest): Promise<Review> {
    const response = await axios.post(API_BASE_URL + 'reviews', request)
    return reviewSchema.parse(response.data)
  }

  async deleteReview(username: string): Promise<void> {
    await axios.delete(API_BASE_URL + `reviews/${username}`)
  }

  async toggleCommentHidden(
    reviewId: string,
    hidden: boolean,
  ): Promise<{ id: string; comment_hidden: boolean }> {
    const response = await axios.patch(API_BASE_URL + `reviews/${reviewId}/visibility`, { hidden })
    return z
      .object({ id: z.string(), comment_hidden: z.boolean() })
      .passthrough()
      .parse(response.data)
  }
}

export default new ReviewService()
