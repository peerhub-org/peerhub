import { randomUUID } from 'node:crypto'
import { Binary, ObjectId } from 'mongodb'
import { describe, expect, test } from 'vitest'
import { MongoDBReviewRepository } from '../../../../src/infrastructure/reviews/database/repositories/mongodb_review_repository.ts'
import { fixtures, useDatabase } from '../../../helpers/database.ts'
import { makeReview, PAST } from '../../../helpers/domain.ts'

const ALICE = 'a0000000-0000-4000-8000-000000000001'
const BOB = 'a0000000-0000-4000-8000-000000000002'
const CAROL = 'a0000000-0000-4000-8000-000000000003'
const ids = fixtures.review_ids

describe('existing documents', () => {
  const db = useDatabase({ withFixtures: true })
  const repository = () => new MongoDBReviewRepository(db())
  const list = async (username: string, limit = 100, offset = 0, status: string | null = null) =>
    (await repository().getAllForUsername(username, limit, offset, status)).map((r) => r.id)

  test('are found by id', async () => {
    expect(await repository().getById(ids.moddy_on_alice!)).toMatchObject({
      id: ids.moddy_on_alice,
      reviewerUuid: 'a0000000-0000-4000-8000-000000000004',
      reviewedUsername: 'alice',
      status: 'comment',
      comment: 'hidden by owner',
      anonymous: false,
      createdAt: new Date('2024-01-13T03:04:05.123Z'),
      updatedAt: new Date('2024-01-13T03:04:05.456Z'),
      commentHidden: true,
      commentHiddenBy: 'alice',
    })
    expect(await repository().getById('f'.repeat(24))).toBeNull()
  })

  test.each(['not-an-id', 'twelve chars', '', `${'f'.repeat(24)}0`])(
    '%j is not an id, so it is not found',
    async (id) => {
      expect(await repository().getById(id)).toBeNull()
    },
  )

  test('may lack newer fields', async () => {
    expect(await repository().getById(ids.legacy_on_alice!)).toMatchObject({
      comment: null,
      anonymous: false,
      commentHidden: false,
      commentHiddenBy: null,
    })
  })

  test('are found by reviewer and username, whatever the case', async () => {
    const review = await repository().getByReviewerAndUsername(CAROL, 'DAVE')
    expect(review).toMatchObject({ id: ids.carol_on_dave, reviewedUsername: 'Dave' })
    expect(await repository().getByReviewerAndUsername(randomUUID(), 'dave')).toBeNull()
  })

  test('are listed by username, whatever the case, newest first', async () => {
    expect(await list('Alice')).toEqual([
      ids.ghost_on_alice,
      ids.modtwo_on_ALICE,
      ids.moddy_on_alice,
      ids.carol_on_alice_anon,
      ids.bob_on_alice,
      ids.legacy_on_alice,
    ])
  })

  test('are paginated and filtered', async () => {
    expect(await list('alice', 2, 1)).toEqual([ids.modtwo_on_ALICE, ids.moddy_on_alice])
    expect(await list('alice', 0, 4)).toEqual([ids.bob_on_alice, ids.legacy_on_alice])
    expect(await list('popular', 0)).toHaveLength(18)
    expect(await list('popular', 100, 0, 'approve')).toHaveLength(6)
    expect(await list('popular', 100, 0, 'bogus')).toEqual([])
  })

  test('are listed by reviewer, newest first', async () => {
    const reviews = await repository().getAllByReviewerUuid(BOB, 2, 1)
    expect(reviews.map((review) => review.id)).toEqual([ids.bob_on_popularmixed, ids.bob_on_carol])
  })

  test('are counted by lowercase username', async () => {
    const counts = await repository().getReviewCountsForUsernames([
      'ALICE',
      'popularmixed',
      'nobody',
    ])
    expect(counts).toEqual(
      new Map([
        ['alice', 6],
        ['popularmixed', 1],
      ]),
    )
  })

  describe('in a feed', () => {
    const feed = async (
      usernames: string[],
      onlyByViewer: string[] = [],
      limit = 100,
      offset = 0,
    ) =>
      (
        await repository().getFeed({ usernames, onlyByViewer, viewerUuid: ALICE }, limit, offset)
      ).map((review) => review.id)

    test('come most recently updated first, whatever the case, without deleted reviewers', async () => {
      expect(await feed(['Alice', 'DAVE'])).toEqual([
        ids.carol_on_dave,
        ids.alice_on_dave,
        ids.modtwo_on_ALICE,
        ids.moddy_on_alice,
        ids.carol_on_alice_anon,
        ids.bob_on_alice,
        ids.legacy_on_alice,
      ])
    })

    test('may be restricted to the ones by the viewer', async () => {
      expect(await feed([], ['DAVE'])).toEqual([ids.alice_on_dave])
      expect(await feed(['ghost'], ['dave'])).toEqual([ids.bob_on_ghost, ids.alice_on_dave])
      expect(await feed([], [])).toEqual([])
    })

    test('are paged after leaving out deleted reviewers', async () => {
      expect(await feed(['alice'], [], 2)).toEqual([ids.modtwo_on_ALICE, ids.moddy_on_alice])
      expect(await feed(['alice'], [], 2, 2)).toEqual([ids.carol_on_alice_anon, ids.bob_on_alice])
    })

    test('are left out when the reviewer is unknown', async () => {
      await db().collection('accounts').deleteOne({ username: 'bob' })
      expect(await feed(['alice'])).not.toContain(ids.bob_on_alice)
    })

    test('are complete entities', async () => {
      const [review] = await repository().getFeed(
        { usernames: ['dave'], onlyByViewer: [], viewerUuid: ALICE },
        1,
        0,
      )
      expect(review).toEqual(await repository().getById(ids.carol_on_dave!))
    })

    test('keep their order between pages when dates are equal', async () => {
      await db()
        .collection('reviews')
        .updateMany({ reviewed_username: 'popular' }, { $set: { updated_at: PAST } })
      const pages: (string | null)[] = []
      for (let offset = 0; offset < 18; offset += 5)
        pages.push(...(await feed(['popular'], [], 5, offset)))
      expect(new Set(pages).size).toBe(18)
    })
  })

  test('are updated', async () => {
    const review = (await repository().getById(ids.bob_on_alice!))!
    review.setCommentHidden(true, 'alice')
    expect(await repository().update(review)).toEqual(review)
    expect(await repository().getById(ids.bob_on_alice!)).toEqual(review)
  })

  test('are deleted one by one or by reviewer', async () => {
    await repository().delete(ids.bob_on_alice!)
    await repository().delete('f'.repeat(24))
    expect(await repository().getById(ids.bob_on_alice!)).toBeNull()
    expect(await repository().deleteAllByReviewerUuid(BOB)).toBe(3)
    expect(await repository().deleteAllByReviewerUuid(BOB)).toBe(0)
    expect(await db().collection('reviews').countDocuments()).toBe(
      fixtures.collections.reviews!.length - 4,
    )
  })
})

describe('new documents', () => {
  const db = useDatabase()
  const repository = () => new MongoDBReviewRepository(db())

  test('have the format of the existing ones', async () => {
    const created = await repository().create(makeReview({ id: null, comment: null }))
    const stored = await db().collection('reviews').findOne({})
    expect(stored).toEqual({
      _id: new ObjectId(created.id!),
      reviewer_uuid: expect.any(Binary),
      reviewed_username: 'bob',
      status: 'approve',
      comment: null,
      anonymous: false,
      created_at: PAST,
      updated_at: PAST,
      comment_hidden: false,
      comment_hidden_by: null,
    })
    expect((stored!.reviewer_uuid as Binary).sub_type).toBe(4)
    expect(await repository().getById(created.id!)).toEqual(created)
  })
})
