import { describe, expect, test } from 'vitest'
import {
  toActivityFeedItemResponse,
  toAccountResponse,
} from '../../../../../src/presentation/api/v1/account/schemas.ts'
import {
  toOwnReviewResponse,
  toReviewerSummaryResponse,
  toReviewResponse,
} from '../../../../../src/presentation/api/v1/review/schemas.ts'
import type { ReviewProps } from '../../../../../src/domain/reviews/entities/review.ts'
import { makeAccount, makeReview, PAST } from '../../../../helpers/domain.ts'

const item = (props: Partial<ReviewProps> = {}) => ({
  review: makeReview({ reviewedUsername: 'alice', ...props }),
  reviewerUsername: 'bob',
  reviewerAvatarUrl: 'https://example.com/bob.png',
  reviewedUserAvatarUrl: 'https://example.com/alice.png',
})
const IDENTITY = {
  reviewer_username: 'bob',
  reviewer_avatar_url: 'https://example.com/bob.png',
}
const NOBODY = { reviewer_uuid: null, reviewer_username: null, reviewer_avatar_url: null }

describe('identity of the reviewer', () => {
  test('is shown', () => {
    expect(toReviewResponse(item())).toMatchObject(IDENTITY)
    expect(toReviewerSummaryResponse(item())).toMatchObject(IDENTITY)
    expect(toActivityFeedItemResponse(item())).toMatchObject(IDENTITY)
  })

  test('is not shown when anonymous, not even to moderators and owners', () => {
    const anonymous = item({ anonymous: true })
    const everything = { isPageOwner: true, isModerator: true }
    expect(toReviewResponse(anonymous)).toMatchObject(NOBODY)
    expect(toReviewResponse(anonymous, everything)).toMatchObject(NOBODY)
    expect(toReviewerSummaryResponse(anonymous)).toMatchObject(NOBODY)
    expect(toActivityFeedItemResponse(anonymous)).toMatchObject(NOBODY)
    for (const response of [
      toReviewResponse(anonymous, everything),
      toReviewerSummaryResponse(anonymous),
      toActivityFeedItemResponse(anonymous),
    ]) {
      expect(JSON.stringify(response)).not.toContain('bob')
      expect(JSON.stringify(response)).not.toContain(anonymous.review.reviewerUuid)
    }
  })

  test('is shown to the author', () => {
    expect(toOwnReviewResponse(item({ anonymous: true }))).toMatchObject(IDENTITY)
  })
})

describe('hidden comments', () => {
  const byOwner = item({ commentHidden: true, commentHiddenBy: 'alice' })
  const byModerator = item({ commentHidden: true, commentHiddenBy: 'mod' })
  const owner = { isPageOwner: true, isModerator: false }
  const moderator = { isPageOwner: false, isModerator: true }
  const stranger = { isPageOwner: false, isModerator: false }

  test.each([
    ['owner', byOwner, owner, 'Great work!', 'user'],
    ['owner', byOwner, moderator, null, 'user'],
    ['owner', byOwner, stranger, null, 'user'],
    ['moderator', byModerator, owner, null, 'moderator'],
    ['moderator', byModerator, moderator, 'Great work!', 'moderator'],
    ['moderator', byModerator, stranger, null, 'moderator'],
  ])('hidden by %s: %#', (_, hidden, viewer, comment, role) => {
    expect(toReviewResponse(hidden, viewer)).toMatchObject({
      comment,
      comment_hidden: true,
      comment_hidden_by: role,
    })
  })

  test('are hidden from everybody by default, and in the feed', () => {
    expect(toReviewResponse(byOwner).comment).toBeNull()
    expect(toActivityFeedItemResponse(byOwner).comment).toBeNull()
    expect(toActivityFeedItemResponse(byModerator)).toMatchObject({
      comment: null,
      comment_hidden_by: 'moderator',
    })
  })

  test('are shown to the author', () => {
    expect(toOwnReviewResponse(byModerator)).toMatchObject({
      comment: 'Great work!',
      comment_hidden_by: 'moderator',
    })
  })

  test('summaries never carry the comment', () => {
    expect(toReviewerSummaryResponse(item())).not.toHaveProperty('comment')
  })

  test('without author have no role', () => {
    expect(toReviewResponse(item({ commentHidden: true }))).toMatchObject({
      comment: null,
      comment_hidden_by: null,
    })
  })

  // Task 53: "Alice" is the owner, but the comparison is case-sensitive.
  test('compare the owner with case', () => {
    const hidden = item({ commentHidden: true, commentHiddenBy: 'Alice' })
    expect(toReviewResponse(hidden).comment_hidden_by).toBe('moderator')
  })
})

test('dates are UTC with milliseconds', () => {
  const account = makeAccount({ deletedAt: PAST, username: 'mod' })
  expect(toAccountResponse(account, new Set(['mod']))).toEqual({
    id: 'a1',
    uuid: account.uuid,
    username: 'mod',
    deleted_at: '2024-01-01T00:00:00.000Z',
    is_moderator: true,
  })
})

test('account responses never carry token or email', () => {
  const account = makeAccount({ email: 'alice@example.test', accessToken: 'gho_secret' })
  expect(JSON.stringify(toAccountResponse(account, new Set()))).not.toMatch(/gho_|@/)
})
