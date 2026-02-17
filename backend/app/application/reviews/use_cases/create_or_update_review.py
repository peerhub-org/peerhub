from uuid import UUID

from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.entities.review import ReviewStatus
from app.domain.reviews.services.review_enrichment_service import ReviewEnrichmentService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.reviews.value_objects.review_with_username import ReviewWithUsername


class CreateOrUpdateReviewUseCase:
    """Use case for creating or updating a review."""

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
        reviewer_uuid: UUID,
        reviewed_username: str,
        status: ReviewStatus,
        comment: str | None,
        anonymous: bool = False,
    ) -> ReviewWithUsername:
        """Create or update a review."""
        review = await self.review_service.create_or_update_review(
            reviewer_uuid=reviewer_uuid,
            reviewed_username=reviewed_username,
            status=status,
            comment=comment,
            anonymous=anonymous,
        )
        enriched = await self.enrichment_service.enrich_reviews([review])
        return enriched[0]
