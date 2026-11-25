import { Review } from '../../../../domain/reviews/entities/review.ts'
import {
  uuidFromBson,
  uuidToBson,
  type Mapper,
} from '../../../shared/database/mappers/base_mapper.ts'
import type { ReviewDocument } from '../models/review_model.ts'

export const reviewMapper: Mapper<Review, ReviewDocument> = {
  toEntity: (document) =>
    new Review({
      id: document._id.toHexString(),
      reviewerUuid: uuidFromBson(document.reviewer_uuid),
      reviewedUsername: document.reviewed_username,
      status: document.status,
      comment: document.comment ?? null,
      anonymous: document.anonymous ?? false,
      createdAt: document.created_at,
      updatedAt: document.updated_at,
      commentHidden: document.comment_hidden,
      commentHiddenBy: document.comment_hidden_by,
    }),

  toFields: (entity) => ({
    reviewer_uuid: uuidToBson(entity.reviewerUuid),
    reviewed_username: entity.reviewedUsername,
    status: entity.status,
    comment: entity.comment,
    anonymous: entity.anonymous,
    created_at: entity.createdAt,
    updated_at: entity.updatedAt,
    comment_hidden: entity.commentHidden,
    comment_hidden_by: entity.commentHiddenBy,
  }),
}
