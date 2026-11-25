import { ObjectId, type Db, type Filter } from 'mongodb'
import type { Review, ReviewStatus } from '../../../../domain/reviews/entities/review.ts'
import type { IReviewRepository } from '../../../../domain/reviews/repositories/review_repository.ts'
import type { Uuid } from '../../../../domain/shared/uuid.ts'
import { CASE_INSENSITIVE } from '../../../shared/database/constants.ts'
import { uuidToBson } from '../../../shared/database/mappers/base_mapper.ts'
import { BaseRepository } from '../../../shared/database/repositories/base_repository.ts'
import { reviewMapper } from '../mappers/review_mapper.ts'
import { REVIEWS, type ReviewDocument } from '../models/review_model.ts'

export class MongoDBReviewRepository
  extends BaseRepository<Review, ReviewDocument>
  implements IReviewRepository
{
  constructor(db: Db) {
    super(db.collection<ReviewDocument>(REVIEWS), reviewMapper)
  }

  async getById(reviewId: string): Promise<Review | null> {
    const document = await this.findById(reviewId)
    return document && reviewMapper.toEntity(document)
  }

  async getByReviewerAndUsername(
    reviewerUuid: Uuid,
    reviewedUsername: string,
  ): Promise<Review | null> {
    const document = await this.collection.findOne(
      { reviewer_uuid: uuidToBson(reviewerUuid), reviewed_username: reviewedUsername },
      { collation: CASE_INSENSITIVE },
    )
    return document && reviewMapper.toEntity(document)
  }

  async getAllForUsername(
    reviewedUsername: string,
    limit: number,
    offset: number,
    status: string | null,
  ): Promise<Review[]> {
    const filter: Filter<ReviewDocument> = { reviewed_username: reviewedUsername }
    if (status !== null) filter.status = status as ReviewStatus
    const documents = await this.collection
      .find(filter, { collation: CASE_INSENSITIVE })
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray()
    return documents.map((document) => reviewMapper.toEntity(document))
  }

  async getAllByReviewerUuid(reviewerUuid: Uuid, limit: number, offset: number): Promise<Review[]> {
    const documents = await this.collection
      .find({ reviewer_uuid: uuidToBson(reviewerUuid) })
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray()
    return documents.map((document) => reviewMapper.toEntity(document))
  }

  async getReviewCountsForUsernames(usernames: string[]): Promise<Map<string, number>> {
    const results = await this.collection
      .aggregate<{
        _id: string
        count: number
      }>(
        [
          { $match: { reviewed_username: { $in: usernames } } },
          { $group: { _id: '$reviewed_username', count: { $sum: 1 } } },
        ],
        { collation: CASE_INSENSITIVE },
      )
      .toArray()
    return new Map(results.map((item) => [item._id, item.count]))
  }

  async delete(reviewId: string): Promise<void> {
    await this.collection.deleteOne({ _id: new ObjectId(reviewId) })
  }

  async deleteAllByReviewerUuid(reviewerUuid: Uuid): Promise<number> {
    const result = await this.collection.deleteMany({ reviewer_uuid: uuidToBson(reviewerUuid) })
    return result.deletedCount
  }
}
