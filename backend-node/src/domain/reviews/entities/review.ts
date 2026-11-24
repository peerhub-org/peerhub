import type { Uuid } from '../../shared/uuid.ts'

export const ReviewStatus = {
  APPROVE: 'approve',
  REQUEST_CHANGE: 'request_change',
  COMMENT: 'comment',
} as const
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus]

export const Role = {
  USER: 'user',
  MODERATOR: 'moderator',
} as const
export type Role = (typeof Role)[keyof typeof Role]

export interface ReviewProps {
  id: string | null
  reviewerUuid: Uuid
  reviewedUsername: string
  status: ReviewStatus
  comment: string | null
  anonymous: boolean
  createdAt: Date
  updatedAt: Date
  commentHidden?: boolean
  commentHiddenBy?: string | null
}

export class Review {
  id: string | null
  reviewerUuid: Uuid
  reviewedUsername: string
  status: ReviewStatus
  comment: string | null
  anonymous: boolean
  createdAt: Date
  updatedAt: Date
  commentHidden: boolean
  commentHiddenBy: string | null

  constructor(props: ReviewProps) {
    this.id = props.id
    this.reviewerUuid = props.reviewerUuid
    this.reviewedUsername = props.reviewedUsername
    this.status = props.status
    this.comment = props.comment
    this.anonymous = props.anonymous
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.commentHidden = props.commentHidden ?? false
    this.commentHiddenBy = props.commentHiddenBy ?? null
  }

  /** Update the review status and comment (anonymous is immutable). */
  updateStatus(status: ReviewStatus, comment: string | null): void {
    this.status = status
    this.comment = comment
    this.updatedAt = new Date()
  }

  /** Set whether the comment is hidden and who hid it. */
  setCommentHidden(hidden: boolean, hiddenBy: string | null = null): void {
    this.commentHidden = hidden
    this.commentHiddenBy = hiddenBy
    this.updatedAt = new Date()
  }
}
