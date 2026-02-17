import {
  FeedFilter,
  PaginatedActivityFeed,
} from '@domains/account/application/interfaces/ActivityFeed'

export interface FeedRepository {
  getActivityFeed: (
    filter: FeedFilter,
    limit: number,
    offset: number,
  ) => Promise<PaginatedActivityFeed>
}
