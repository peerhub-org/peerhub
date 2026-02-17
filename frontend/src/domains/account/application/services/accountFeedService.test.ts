import { describe, it, expect } from 'vitest'
import accountFeedService from './accountFeedService'

describe('AccountFeedService', () => {
  it('getActivityFeed returns paginated feed', async () => {
    const feed = await accountFeedService.getActivityFeed()
    expect(feed.items).toEqual([])
    expect(feed.has_more).toBe(false)
  })
})
