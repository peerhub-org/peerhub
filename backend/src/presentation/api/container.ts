import type { Db } from 'mongodb'
import { DeleteAccountUseCase } from '../../application/accounts/use_cases/delete_account.ts'
import { GetActivityFeedUseCase } from '../../application/accounts/use_cases/get_activity_feed.ts'
import { GetCurrentAccountUseCase } from '../../application/accounts/use_cases/get_current_account.ts'
import { AuthenticateWithGitHubUseCase } from '../../application/github/use_cases/authenticate_with_github.ts'
import { GetUserUseCase } from '../../application/github/use_cases/get_user.ts'
import { SearchUsersUseCase } from '../../application/github/use_cases/search_users.ts'
import { CreateOrUpdateReviewUseCase } from '../../application/reviews/use_cases/create_or_update_review.ts'
import { DeleteReviewUseCase } from '../../application/reviews/use_cases/delete_review.ts'
import { GetMyReviewsUseCase } from '../../application/reviews/use_cases/get_my_reviews.ts'
import { GetReviewersUseCase } from '../../application/reviews/use_cases/get_reviewers.ts'
import { GetReviewsUseCase } from '../../application/reviews/use_cases/get_reviews.ts'
import { GetSuggestionsUseCase } from '../../application/reviews/use_cases/get_suggestions.ts'
import { ToggleCommentHiddenUseCase } from '../../application/reviews/use_cases/toggle_comment_hidden.ts'
import { CheckWatchUseCase } from '../../application/watchlist/use_cases/check_watch.ts'
import { GetWatchlistUseCase } from '../../application/watchlist/use_cases/get_watchlist.ts'
import { UnwatchUseCase } from '../../application/watchlist/use_cases/unwatch.ts'
import { WatchUseCase } from '../../application/watchlist/use_cases/watch.ts'
import { AccountService } from '../../domain/accounts/services/account_service.ts'
import { ReviewEnrichmentService } from '../../domain/reviews/services/review_enrichment_service.ts'
import { ReviewService } from '../../domain/reviews/services/review_service.ts'
import { UserService } from '../../domain/users/services/user_service.ts'
import { WatchlistService } from '../../domain/watchlist/services/watchlist_service.ts'
import { MongoDBAccountRepository } from '../../infrastructure/accounts/database/repositories/mongodb_account_repository.ts'
import { EmailService, type SendEmail } from '../../infrastructure/email/email_service.ts'
import {
  GitHubClient,
  type GitHubUrls,
} from '../../infrastructure/github/external/github_client.ts'
import { MongoDBReviewRepository } from '../../infrastructure/reviews/database/repositories/mongodb_review_repository.ts'
import type { Settings } from '../../infrastructure/shared/config/config.ts'
import { pingDatabase } from '../../infrastructure/shared/database/connection.ts'
import { FeatureFlagService } from '../../infrastructure/shared/observability/feature_flags.ts'
import { namedLogger, type Logger } from '../../infrastructure/shared/observability/logging.ts'
import type { PostHogClient } from '../../infrastructure/shared/observability/posthog.ts'
import { TokenService } from '../../infrastructure/shared/security/token_service.ts'
import { MongoDBUserRepository } from '../../infrastructure/users/database/repositories/mongodb_user_repository.ts'
import { MongoDBWatchlistRepository } from '../../infrastructure/watchlist/database/repositories/mongodb_watchlist_repository.ts'

export interface ContainerOptions {
  settings: Settings
  db: Db
  /** Root logger */
  logger: Logger
  posthog: PostHogClient | null
  /** Replaced in tests */
  overrides?: {
    featureFlags?: Pick<FeatureFlagService, 'getFeatureFlags'>
    sendEmail?: SendEmail
    githubUrls?: GitHubUrls
    pingDatabase?: () => Promise<void>
  }
}

export type Container = ReturnType<typeof createContainer>

/** Build every object of the application, once. */
export function createContainer({ settings, db, logger, posthog, overrides }: ContainerOptions) {
  const accounts = new MongoDBAccountRepository(db)
  const reviews = new MongoDBReviewRepository(db)
  const users = new MongoDBUserRepository(db)
  const watchlist = new MongoDBWatchlistRepository(db)

  const accountService = new AccountService(accounts)
  const userService = new UserService(users)
  const reviewService = new ReviewService(reviews, accounts, users)
  const watchlistService = new WatchlistService(watchlist, accounts, users)
  const enrichmentService = new ReviewEnrichmentService(accountService, userService)

  const github = new GitHubClient(settings, namedLogger(logger, 'github'), overrides?.githubUrls)
  const emailService = new EmailService(
    settings,
    namedLogger(logger, 'email'),
    overrides?.sendEmail,
  )
  const featureFlags =
    overrides?.featureFlags ?? new FeatureFlagService(posthog, namedLogger(logger, 'feature_flags'))
  const moderators = settings.MODERATOR_USERNAMES

  return {
    settings,
    logger,
    accountService,
    tokenService: new TokenService(settings),
    pingDatabase: overrides?.pingDatabase ?? (() => pingDatabase(db)),
    useCases: {
      getCurrentAccount: new GetCurrentAccountUseCase(accountService),
      deleteAccount: new DeleteAccountUseCase(accountService, reviewService, watchlistService),
      getActivityFeed: new GetActivityFeedUseCase(
        watchlistService,
        reviewService,
        accountService,
        userService,
        featureFlags,
      ),
      authenticateWithGitHub: new AuthenticateWithGitHubUseCase(
        accountService,
        userService,
        github,
        emailService,
        namedLogger(logger, 'authenticate_with_github'),
      ),
      getUser: new GetUserUseCase(accountService, userService, github),
      searchUsers: new SearchUsersUseCase(accountService, github),
      createOrUpdateReview: new CreateOrUpdateReviewUseCase(
        reviewService,
        accountService,
        enrichmentService,
        watchlistService,
        emailService,
        namedLogger(logger, 'create_or_update_review'),
      ),
      deleteReview: new DeleteReviewUseCase(reviewService),
      getMyReviews: new GetMyReviewsUseCase(reviewService, enrichmentService),
      getReviewers: new GetReviewersUseCase(
        reviewService,
        accountService,
        userService,
        enrichmentService,
        featureFlags,
      ),
      getReviews: new GetReviewsUseCase(
        reviewService,
        accountService,
        enrichmentService,
        featureFlags,
        moderators,
      ),
      getSuggestions: new GetSuggestionsUseCase(
        accountService,
        watchlistService,
        reviewService,
        github,
      ),
      toggleCommentHidden: new ToggleCommentHiddenUseCase(
        reviewService,
        accountService,
        enrichmentService,
        moderators,
      ),
      watch: new WatchUseCase(watchlistService),
      unwatch: new UnwatchUseCase(watchlistService),
      checkWatch: new CheckWatchUseCase(watchlistService),
      getWatchlist: new GetWatchlistUseCase(watchlistService, userService),
    },
  }
}
