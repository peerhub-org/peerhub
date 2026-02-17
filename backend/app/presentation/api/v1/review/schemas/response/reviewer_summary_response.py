from datetime import datetime
from uuid import UUID

from app.application.reviews.use_cases.get_reviews import ReviewWithUsername
from app.domain.reviews.entities.review import ReviewStatus
from app.presentation.api.v1.shared.schemas.response.base_response import BaseResponse


class ReviewerSummaryResponse(BaseResponse):
    """Lightweight reviewer info for the sidebar (no comment/content)."""

    id: str
    reviewer_uuid: UUID | None
    reviewer_username: str | None
    reviewer_avatar_url: str | None
    reviewed_username: str
    status: ReviewStatus
    anonymous: bool
    updated_at: datetime

    @classmethod
    def from_review_with_username(
        cls, review_with_username: ReviewWithUsername
    ) -> "ReviewerSummaryResponse":
        """Create from ReviewWithUsername (hides identity if anonymous)."""
        review = review_with_username.review
        if review.id is None:
            raise ValueError("Review entity must have an id")

        if review.anonymous:
            return cls(
                id=review.id,
                reviewer_uuid=None,
                reviewer_username=None,
                reviewer_avatar_url=None,
                reviewed_username=review.reviewed_username,
                status=review.status,
                anonymous=True,
                updated_at=review.updated_at,
            )

        return cls(
            id=review.id,
            reviewer_uuid=review.reviewer_uuid,
            reviewer_username=review_with_username.reviewer_username,
            reviewer_avatar_url=review_with_username.reviewer_avatar_url,
            reviewed_username=review.reviewed_username,
            status=review.status,
            anonymous=False,
            updated_at=review.updated_at,
        )
