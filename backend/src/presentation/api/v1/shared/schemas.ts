import { z } from 'zod'
import { ReviewStatus, Role, type Review } from '../../../../domain/reviews/entities/review.ts'

export const dateTime = z.iso.datetime()

export const reviewStatus = z.enum(Object.values(ReviewStatus)).meta({ id: 'ReviewStatus' })
export const role = z.enum(Object.values(Role)).meta({ id: 'Role' })

export const toDateTime = (date: Date): string => date.toISOString()
export const toOptionalDateTime = (date: Date | null): string | null => date && toDateTime(date)

/** Entities that reach the API were stored, so they have an id. */
export function storedId(entity: { id: string | null }): string {
  if (entity.id === null) throw new Error('Entity must have an id')
  return entity.id
}

/** Who hid the comment, without saying the name. Task 53: case-sensitive. */
export function hiddenByRole(review: Review): Role | null {
  if (!review.commentHidden || review.commentHiddenBy === null) return null
  return review.commentHiddenBy === review.reviewedUsername ? Role.USER : Role.MODERATOR
}
