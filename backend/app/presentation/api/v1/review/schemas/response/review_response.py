from datetime import datetime
from uuid import UUID

from app.application.reviews.use_cases.get_reviews import ReviewWithUsername
from app.domain.reviews.entities.review import Review, ReviewStatus, Role
from app.presentation.api.v1.shared.schemas.response.base_response import BaseResponse


def _resolve_hidden_by_description(review: Review) -> Role | None:
    """Derive the hidden-by role label from a review entity."""
    if not review.comment_hidden or review.comment_hidden_by is None:
        return None
    if review.comment_hidden_by == review.reviewed_username:
        return Role.USER
    return Role.MODERATOR


class ReviewResponse(BaseResponse):
    """Response schema for review data."""

    id: str
    reviewer_uuid: UUID | None
    reviewer_username: str | None
    reviewer_avatar_url: str | None
    reviewed_username: str
    status: ReviewStatus
    comment: str | None
    anonymous: bool
    comment_hidden: bool
    comment_hidden_by: Role | None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_review_with_username(
        cls,
        review_with_username: ReviewWithUsername,
        is_page_owner: bool = False,
        is_moderator: bool = False,
    ) -> "ReviewResponse":
        """Create ReviewResponse from ReviewWithUsername (hides identity if anonymous)."""
        review = review_with_username.review
        if review.id is None:
            raise ValueError("Review entity must have an id")

        hidden_by_description = _resolve_hidden_by_description(review)

        # Comment text visibility logic
        comment = review.comment
        if review.comment_hidden:
            hidden_by_owner = hidden_by_description == Role.USER
            if hidden_by_owner and is_page_owner:
                # Owner can see their own hides (muted in UI)
                pass
            elif not hidden_by_owner and is_moderator:
                # Moderator can see moderator hides (muted in UI)
                pass
            else:
                comment = None

        if review.anonymous:
            return cls(
                id=review.id,
                reviewer_uuid=None,
                reviewer_username=None,
                reviewer_avatar_url=None,
                reviewed_username=review.reviewed_username,
                status=review.status,
                comment=comment,
                anonymous=True,
                comment_hidden=review.comment_hidden,
                comment_hidden_by=hidden_by_description,
                created_at=review.created_at,
                updated_at=review.updated_at,
            )

        return cls(
            id=review.id,
            reviewer_uuid=review.reviewer_uuid,
            reviewer_username=review_with_username.reviewer_username,
            reviewer_avatar_url=review_with_username.reviewer_avatar_url,
            reviewed_username=review.reviewed_username,
            status=review.status,
            comment=comment,
            anonymous=False,
            comment_hidden=review.comment_hidden,
            comment_hidden_by=hidden_by_description,
            created_at=review.created_at,
            updated_at=review.updated_at,
        )

    @classmethod
    def from_entity(
        cls,
        review: Review,
        reviewer_username: str,
        reviewer_avatar_url: str | None = None,
    ) -> "ReviewResponse":
        """Create ReviewResponse from Review entity (shows full identity for owner)."""
        if review.id is None:
            raise ValueError("Review entity must have an id")

        hidden_by_description = _resolve_hidden_by_description(review)

        return cls(
            id=review.id,
            reviewer_uuid=review.reviewer_uuid,
            reviewer_username=reviewer_username,
            reviewer_avatar_url=reviewer_avatar_url,
            reviewed_username=review.reviewed_username,
            status=review.status,
            comment=review.comment,
            anonymous=review.anonymous,
            comment_hidden=review.comment_hidden,
            comment_hidden_by=hidden_by_description,
            created_at=review.created_at,
            updated_at=review.updated_at,
        )
