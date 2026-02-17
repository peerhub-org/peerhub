import { FeedRepository } from '@domains/account/application/interfaces/FeedRepository'
import accountFeedService from '@domains/account/application/services/accountFeedService'

export const feedRepository: FeedRepository = {
  getActivityFeed: (filter, limit, offset) =>
    accountFeedService.getActivityFeed(filter, limit, offset),
}
