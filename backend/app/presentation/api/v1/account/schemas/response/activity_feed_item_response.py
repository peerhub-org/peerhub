from datetime import datetime
from uuid import UUID

from app.application.accounts.use_cases.get_activity_feed import ActivityFeedItem
from app.domain.reviews.entities.review import ReviewStatus
from app.presentation.api.v1.shared.schemas.response.base_response import BaseResponse


class ActivityFeedItemResponse(BaseResponse):
    """Response schema for an activity feed item."""

    review_id: str
    reviewer_uuid: UUID | None
    reviewer_username: str | None
    reviewer_avatar_url: str | None
    reviewed_username: str
    reviewed_user_avatar_url: str | None
    status: ReviewStatus
    comment: str | None
    anonymous: bool
    comment_hidden: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_activity_item(cls, item: ActivityFeedItem) -> "ActivityFeedItemResponse":
        """Create response from ActivityFeedItem."""
        review = item.review
        if review.id is None:
            raise ValueError("Review must have an id")

        comment = None if review.comment_hidden else review.comment

        if review.anonymous:
            return cls(
                review_id=review.id,
                reviewer_uuid=None,
                reviewer_username=None,
                reviewer_avatar_url=None,
                reviewed_username=review.reviewed_username,
                reviewed_user_avatar_url=item.reviewed_user_avatar_url,
                status=review.status,
                comment=comment,
                anonymous=True,
                comment_hidden=review.comment_hidden,
                created_at=review.created_at,
                updated_at=review.updated_at,
            )

        return cls(
            review_id=review.id,
            reviewer_uuid=review.reviewer_uuid,
            reviewer_username=item.reviewer_username,
            reviewer_avatar_url=item.reviewer_avatar_url,
            reviewed_username=review.reviewed_username,
            reviewed_user_avatar_url=item.reviewed_user_avatar_url,
            status=review.status,
            comment=comment,
            anonymous=False,
            comment_hidden=review.comment_hidden,
            created_at=review.created_at,
            updated_at=review.updated_at,
        )
