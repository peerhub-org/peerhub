from fastapi import Depends

from app.application.accounts.use_cases.delete_account import DeleteAccountUseCase
from app.application.accounts.use_cases.get_activity_feed import (
    GetActivityFeedUseCase,
)
from app.application.accounts.use_cases.get_current_account import (
    GetCurrentAccountUseCase,
)
from app.application.reviews.use_cases.get_my_reviews import GetMyReviewsUseCase
from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.services.review_enrichment_service import ReviewEnrichmentService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.users.services.user_service import UserService
from app.domain.watchlist.services.watchlist_service import WatchlistService

from .services import (
    get_account_service,
    get_review_enrichment_service,
    get_review_service,
    get_user_service,
    get_watchlist_service,
)


def get_current_account_use_case(
    account_service: AccountService = Depends(get_account_service),
) -> GetCurrentAccountUseCase:
    """Get current account use case instance."""
    return GetCurrentAccountUseCase(account_service)


def get_delete_account_use_case(
    account_service: AccountService = Depends(get_account_service),
    review_service: ReviewService = Depends(get_review_service),
    watchlist_service: WatchlistService = Depends(get_watchlist_service),
) -> DeleteAccountUseCase:
    """Get delete account use case instance."""
    return DeleteAccountUseCase(account_service, review_service, watchlist_service)


def get_my_reviews_use_case(
    review_service: ReviewService = Depends(get_review_service),
    enrichment_service: ReviewEnrichmentService = Depends(get_review_enrichment_service),
) -> GetMyReviewsUseCase:
    """Get my reviews use case instance."""
    return GetMyReviewsUseCase(review_service, enrichment_service)


def get_activity_feed_use_case(
    watchlist_service: WatchlistService = Depends(get_watchlist_service),
    review_service: ReviewService = Depends(get_review_service),
    account_service: AccountService = Depends(get_account_service),
    user_service: UserService = Depends(get_user_service),
) -> GetActivityFeedUseCase:
    """Get activity feed use case instance."""
    return GetActivityFeedUseCase(
        watchlist_service,
        review_service,
        account_service,
        user_service,
    )
