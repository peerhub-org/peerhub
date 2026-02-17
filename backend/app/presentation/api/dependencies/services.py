from fastapi import Depends

from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.services.review_enrichment_service import ReviewEnrichmentService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.users.services.user_service import UserService
from app.domain.watchlist.services.watchlist_service import WatchlistService

from .repositories import (
    AccountRepositoryDep,
    ReviewRepositoryDep,
    UserRepositoryDep,
    WatchlistRepositoryDep,
)


def get_account_service(
    account_repository: AccountRepositoryDep,
) -> AccountService:
    """Get account service instance."""
    return AccountService(account_repository)


def get_review_service(
    review_repository: ReviewRepositoryDep,
    account_repository: AccountRepositoryDep,
    user_repository: UserRepositoryDep,
) -> ReviewService:
    """Get review service instance."""
    return ReviewService(review_repository, account_repository, user_repository)


def get_user_service(
    user_repository: UserRepositoryDep,
) -> UserService:
    """Get user service instance."""
    return UserService(user_repository)


def get_watchlist_service(
    watchlist_repository: WatchlistRepositoryDep,
    account_repository: AccountRepositoryDep,
    user_repository: UserRepositoryDep,
) -> WatchlistService:
    """Get watch service instance."""
    return WatchlistService(watchlist_repository, account_repository, user_repository)


def get_review_enrichment_service(
    account_service: AccountService = Depends(get_account_service),
    user_service: UserService = Depends(get_user_service),
) -> ReviewEnrichmentService:
    """Get review enrichment service instance."""
    return ReviewEnrichmentService(account_service, user_service)
