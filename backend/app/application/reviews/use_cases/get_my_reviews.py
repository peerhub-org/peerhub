from uuid import UUID

from app.domain.reviews.services.review_enrichment_service import ReviewEnrichmentService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.reviews.value_objects.review_with_username import ReviewWithUsername


class GetMyReviewsUseCase:
    """Use case for retrieving the current user's reviews."""

    def __init__(
        self,
        review_service: ReviewService,
        enrichment_service: ReviewEnrichmentService,
    ):
        self.review_service = review_service
        self.enrichment_service = enrichment_service

    async def execute(
        self, reviewer_uuid: UUID, limit: int = 100, offset: int = 0
    ) -> list[ReviewWithUsername]:
        """Get all reviews made by the authenticated user with full identity."""
        reviews = await self.review_service.get_reviews_by_reviewer(
            reviewer_uuid, limit, offset
        )
        return await self.enrichment_service.enrich_reviews(reviews)
