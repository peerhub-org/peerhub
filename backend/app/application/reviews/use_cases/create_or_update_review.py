import logging
from uuid import UUID

from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.entities.review import ReviewStatus
from app.domain.reviews.services.review_enrichment_service import ReviewEnrichmentService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.reviews.value_objects.review_with_username import ReviewWithUsername
from app.domain.watchlist.services.watchlist_service import WatchlistService
from app.infrastructure.email.email_service import EmailService

logger = logging.getLogger(__name__)


class CreateOrUpdateReviewUseCase:
    """Use case for creating or updating a review."""

    def __init__(
        self,
        review_service: ReviewService,
        account_service: AccountService,
        enrichment_service: ReviewEnrichmentService,
        watchlist_service: WatchlistService,
        email_service: EmailService,
    ):
        self.review_service = review_service
        self.account_service = account_service
        self.enrichment_service = enrichment_service
        self.watchlist_service = watchlist_service
        self.email_service = email_service

    async def execute(
        self,
        reviewer_uuid: UUID,
        reviewed_username: str,
        status: ReviewStatus,
        comment: str | None,
        anonymous: bool = False,
    ) -> ReviewWithUsername:
        """Create or update a review."""
        review, is_new = await self.review_service.create_or_update_review(
            reviewer_uuid=reviewer_uuid,
            reviewed_username=reviewed_username,
            status=status,
            comment=comment,
            anonymous=anonymous,
        )

        if is_new:
            try:
                reviewer = await self.account_service.get_account_by_uuid(
                    reviewer_uuid
                )
                self.email_service.send_new_review_notification(
                    reviewer_username=reviewer.username,
                    reviewed_username=reviewed_username,
                    status=status.value,
                    comment=comment,
                    anonymous=anonymous,
                )
            except Exception:
                logger.exception(
                    "Failed to send new review notification email"
                )

        try:
            await self.watchlist_service.watch(reviewer_uuid, reviewed_username)
        except Exception:
            logger.exception("Failed to auto-watch user after review submission")

        enriched = await self.enrichment_service.enrich_reviews([review])
        return enriched[0]
