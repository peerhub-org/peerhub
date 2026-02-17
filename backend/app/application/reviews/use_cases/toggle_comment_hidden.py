from uuid import UUID

from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.services.review_enrichment_service import ReviewEnrichmentService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.reviews.value_objects.review_with_username import ReviewWithUsername
from app.domain.shared.exceptions import (
    ReviewNotFoundException,
    UnauthorizedActionException,
)


class ToggleCommentHiddenUseCase:
    """Use case for toggling the hidden state of a review comment."""

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
        self, review_id: str, current_account_uuid: UUID, hidden: bool
    ) -> ReviewWithUsername:
        """
        Toggle the hidden state of a review comment.

        Only the page owner (reviewed_username) can hide/unhide comments.
        """
        review = await self.review_service.get_review_by_id(review_id)
        if review is None:
            raise ReviewNotFoundException(review_id)

        current_account = await self.account_service.get_account_by_uuid(
            current_account_uuid
        )

        if current_account.username != review.reviewed_username:
            raise UnauthorizedActionException(
                "Only the page owner can hide/unhide comments"
            )

        review.set_comment_hidden(hidden)
        updated_review = await self.review_service.update_review(review)
        enriched = await self.enrichment_service.enrich_reviews([updated_review])
        return enriched[0]
