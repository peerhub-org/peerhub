from fastapi import Depends

from app.application.reviews.use_cases.create_or_update_review import (
    CreateOrUpdateReviewUseCase,
)
from app.application.reviews.use_cases.delete_review import DeleteReviewUseCase
from app.application.reviews.use_cases.get_reviewers import GetReviewersUseCase
from app.application.reviews.use_cases.get_reviews import GetReviewsUseCase
from app.application.reviews.use_cases.get_suggestions import GetSuggestionsUseCase
from app.application.reviews.use_cases.toggle_comment_hidden import (
    ToggleCommentHiddenUseCase,
)
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


def get_create_or_update_review_use_case(
    review_service: ReviewService = Depends(get_review_service),
    account_service: AccountService = Depends(get_account_service),
    enrichment_service: ReviewEnrichmentService = Depends(get_review_enrichment_service),
    watchlist_service: WatchlistService = Depends(get_watchlist_service),
) -> CreateOrUpdateReviewUseCase:
    """Get create or update review use case instance."""
    return CreateOrUpdateReviewUseCase(
        review_service, account_service, enrichment_service, watchlist_service
    )


def get_reviews_use_case(
    review_service: ReviewService = Depends(get_review_service),
    account_service: AccountService = Depends(get_account_service),
    enrichment_service: ReviewEnrichmentService = Depends(get_review_enrichment_service),
) -> GetReviewsUseCase:
    """Get reviews use case instance."""
    return GetReviewsUseCase(review_service, account_service, enrichment_service)


def get_reviewers_use_case(
    review_service: ReviewService = Depends(get_review_service),
    account_service: AccountService = Depends(get_account_service),
    user_service: UserService = Depends(get_user_service),
    enrichment_service: ReviewEnrichmentService = Depends(get_review_enrichment_service),
) -> GetReviewersUseCase:
    """Get reviewers use case instance."""
    return GetReviewersUseCase(
        review_service, account_service, user_service, enrichment_service
    )


def get_delete_review_use_case(
    review_service: ReviewService = Depends(get_review_service),
) -> DeleteReviewUseCase:
    """Get delete review use case instance."""
    return DeleteReviewUseCase(review_service)


def get_toggle_comment_hidden_use_case(
    review_service: ReviewService = Depends(get_review_service),
    account_service: AccountService = Depends(get_account_service),
    enrichment_service: ReviewEnrichmentService = Depends(get_review_enrichment_service),
) -> ToggleCommentHiddenUseCase:
    """Get toggle comment hidden use case instance."""
    return ToggleCommentHiddenUseCase(review_service, account_service, enrichment_service)


def get_suggestions_use_case(
    watchlist_service: WatchlistService = Depends(get_watchlist_service),
    review_service: ReviewService = Depends(get_review_service),
    account_service: AccountService = Depends(get_account_service),
) -> GetSuggestionsUseCase:
    """Get suggestions use case instance."""
    return GetSuggestionsUseCase(account_service, watchlist_service, review_service)
