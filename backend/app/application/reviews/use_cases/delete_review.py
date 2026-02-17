from uuid import UUID

from app.domain.reviews.services.review_service import ReviewService


class DeleteReviewUseCase:
    """Use case for deleting a review."""

    def __init__(self, review_service: ReviewService):
        self.review_service = review_service

    async def execute(self, reviewer_uuid: UUID, reviewed_username: str) -> None:
        """Delete a review for a given user."""
        await self.review_service.delete_review(reviewer_uuid, reviewed_username)
