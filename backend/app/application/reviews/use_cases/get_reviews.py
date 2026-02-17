from dataclasses import dataclass
from uuid import UUID

from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.services.review_enrichment_service import ReviewEnrichmentService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.reviews.value_objects.review_with_username import ReviewWithUsername
from app.domain.shared.constants import DEFAULT_PAGE_SIZE

# Re-export for backwards compatibility
__all__ = ["ReviewWithUsername", "PaginatedReviewsResult", "GetReviewsUseCase"]


@dataclass
class PaginatedReviewsResult:
    """Paginated reviews with metadata for page rendering."""

    items: list[ReviewWithUsername]
    has_more: bool
    is_page_owner: bool


class GetReviewsUseCase:
    """Use case for retrieving reviews for a user."""

    def __init__(
        self,
        review_service: ReviewService,
        account_service: AccountService,
        enrichment_service: ReviewEnrichmentService,
    ):
        self.review_service = review_service
        self.account_service = account_service
        self.enrichment_service = enrichment_service

    async def execute(
        self,
        reviewed_username: str,
        viewer_uuid: UUID,
        limit: int = DEFAULT_PAGE_SIZE,
        offset: int = 0,
        status: str | None = None,
    ) -> PaginatedReviewsResult:
        """Get paginated reviews with reviewer usernames resolved."""
        current_account = await self.account_service.get_account_by_uuid(viewer_uuid)
        is_page_owner = (
            current_account is not None
            and current_account.username.lower() == reviewed_username.lower()
        )

        target_account = await self.account_service.get_account_by_username(
            reviewed_username
        )
        is_draft = target_account is None

        if is_draft:
            reviews = await self.review_service.get_reviews_for_user(
                reviewed_username, limit=0, offset=0, status=status
            )
            reviews = [r for r in reviews if r.reviewer_uuid == viewer_uuid]
            has_more = len(reviews) > offset + limit
            reviews = reviews[offset : offset + limit]
        else:
            reviews = await self.review_service.get_reviews_for_user(
                reviewed_username, limit + 1, offset, status=status
            )
            has_more = len(reviews) > limit
            reviews = reviews[:limit]

        results = await self.enrichment_service.enrich_reviews(reviews)

        return PaginatedReviewsResult(
            items=results,
            has_more=has_more,
            is_page_owner=is_page_owner,
        )
