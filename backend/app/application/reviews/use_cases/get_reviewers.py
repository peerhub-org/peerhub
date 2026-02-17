from uuid import UUID

from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.services.review_enrichment_service import ReviewEnrichmentService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.reviews.value_objects.review_with_username import ReviewWithUsername
from app.domain.shared.constants import MAX_REVIEWERS
from app.domain.users.services.user_service import UserService


class GetReviewersUseCase:
    """Use case for retrieving all reviewers for a user (no pagination)."""

    def __init__(
        self,
        review_service: ReviewService,
        account_service: AccountService,
        user_service: UserService,
        enrichment_service: ReviewEnrichmentService,
    ):
        self.review_service = review_service
        self.account_service = account_service
        self.user_service = user_service
        self.enrichment_service = enrichment_service

    async def execute(
        self, reviewed_username: str, viewer_uuid: UUID
    ) -> list[ReviewWithUsername]:
        """Get all reviewers for a user with resolved usernames and avatars."""
        target_account = await self.account_service.get_account_by_username(
            reviewed_username
        )
        if target_account:
            user = await self.user_service.get_user_by_username(target_account.username)
            if user is None:
                return []

        reviews = await self.review_service.get_reviews_for_user(
            reviewed_username, limit=MAX_REVIEWERS, offset=0
        )

        if target_account is None:
            reviews = [
                review for review in reviews if review.reviewer_uuid == viewer_uuid
            ]

        return await self.enrichment_service.enrich_reviews(reviews)
