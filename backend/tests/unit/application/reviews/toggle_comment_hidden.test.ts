import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, test } from 'vitest'
import { ToggleCommentHiddenUseCase } from '../../../../src/application/reviews/use_cases/toggle_comment_hidden.ts'
import {
  ReviewNotFoundException,
  UnauthorizedActionException,
} from '../../../../src/domain/shared/exceptions.ts'
import { createDomain, makeAccount, makeReview } from '../../../helpers/domain.ts'

const reviewer = makeAccount({ id: 'a2', username: 'bob' })
const MODERATORS = new Set(['mod1', 'mod2'])

let domain: ReturnType<typeof createDomain>
beforeEach(() => {
  domain = createDomain()
  domain.repositories.accounts.getByUuids.mockResolvedValue([reviewer])
})

/** Toggle, as the given user, a comment on alice's page. */
function toggle(
  as: string,
  hidden: boolean,
  hiddenBy: string | null = null,
  alreadyHidden = hiddenBy !== null,
) {
  const account = makeAccount({ username: as })
  domain.repositories.accounts.getByUuid.mockResolvedValue(account)
  domain.repositories.reviews.getById.mockResolvedValue(
    makeReview({
      reviewerUuid: reviewer.uuid,
      reviewedUsername: 'alice',
      commentHidden: alreadyHidden,
      commentHiddenBy: hiddenBy,
    }),
  )
  return new ToggleCommentHiddenUseCase(
    domain.reviewService,
    domain.accountService,
    domain.enrichmentService,
    MODERATORS,
  ).execute('r1', account.uuid, hidden)
}

describe('hiding', () => {
  test.each([
    ['alice', true, false],
    ['Alice', true, false],
    ['mod1', false, true],
  ])('%s may hide', async (as, isPageOwner, isModerator) => {
    expect(await toggle(as, true)).toMatchObject({
      reviewWithUsername: {
        review: { commentHidden: true, commentHiddenBy: as },
        reviewerUsername: 'bob',
      },
      isPageOwner,
      isModerator,
    })
    expect(domain.repositories.reviews.update).toHaveBeenCalledOnce()
  })

  test.each(['bob', 'someone', 'MOD1'])('%s may not hide', async (as) => {
    await expect(toggle(as, true)).rejects.toThrow(
      new UnauthorizedActionException('Only the page owner or moderators can hide/unhide comments'),
    )
    expect(domain.repositories.reviews.update).not.toHaveBeenCalled()
  })
})

describe('hiding what is already hidden', () => {
  test.each(['mod1', 'MOD1', null])('owners may not take over from %s', async (hiddenBy) => {
    await expect(toggle('alice', true, hiddenBy, true)).rejects.toThrow(
      new UnauthorizedActionException('This comment was already hidden by a moderator'),
    )
    expect(domain.repositories.reviews.update).not.toHaveBeenCalled()
  })

  test.each([
    ['alice', 'alice'],
    ['alice', 'ALICE'],
    ['mod1', 'mod1'],
    ['mod1', 'mod2'],
    ['mod1', 'alice'],
  ])('%s may hide again what %s hid', async (as, hiddenBy) => {
    const { reviewWithUsername } = await toggle(as, true, hiddenBy)
    expect(reviewWithUsername.review).toMatchObject({ commentHidden: true, commentHiddenBy: as })
  })
})

describe('showing again', () => {
  test.each([
    ['alice', 'alice'],
    ['alice', 'ALICE'],
    ['mod1', 'mod1'],
    ['mod1', 'mod2'],
    ['mod1', null],
  ])('%s may show what %s hid', async (as, hiddenBy) => {
    const { reviewWithUsername } = await toggle(as, false, hiddenBy)
    expect(reviewWithUsername.review).toMatchObject({
      commentHidden: false,
      commentHiddenBy: null,
    })
  })

  test.each([
    ['alice', 'mod1'],
    ['mod1', 'alice'],
    ['mod1', 'ALICE'],
    ['alice', null],
  ])('%s may not show what %s hid', async (as, hiddenBy) => {
    await expect(toggle(as, false, hiddenBy)).rejects.toThrow(
      new UnauthorizedActionException('You can only unhide comments that you hid'),
    )
    expect(domain.repositories.reviews.update).not.toHaveBeenCalled()
  })
})

test('fails for an unknown review', async () => {
  const useCase = new ToggleCommentHiddenUseCase(
    domain.reviewService,
    domain.accountService,
    domain.enrichmentService,
    MODERATORS,
  )
  await expect(useCase.execute('nonexistent', randomUUID(), true)).rejects.toThrow(
    ReviewNotFoundException,
  )
})

test('changes nothing in a review by a deleted account', async () => {
  domain.repositories.accounts.getByUuids.mockResolvedValue([])
  await expect(toggle('alice', true)).rejects.toThrow(ReviewNotFoundException)
  expect(domain.repositories.reviews.update).not.toHaveBeenCalled()
})
