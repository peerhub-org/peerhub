from datetime import datetime, timezone
from uuid import UUID

from app.domain.accounts.repositories.account_repository import IAccountRepository
from app.domain.reviews.entities.review import Review, ReviewStatus
from app.domain.reviews.repositories.review_repository import IReviewRepository
from app.domain.reviews.services.comment_sanitizer import sanitize_comment
from app.domain.shared.constants import MAX_COMMENT_LENGTH
from app.domain.shared.exceptions import (
    AnonymousFieldImmutableException,
    ReviewValidationException,
    SelfReviewException,
)
from app.domain.shared.services.validators import (
    check_not_self_action,
    check_target_is_user_type,
)
from app.domain.users.repositories.user_repository import IUserRepository


class ReviewService:
    """Domain service for review business logic."""

    def __init__(
        self,
        review_repository: IReviewRepository,
        account_repository: IAccountRepository,
        user_repository: IUserRepository,
    ):
        self.review_repository = review_repository
        self.account_repository = account_repository
        self.user_repository = user_repository

    def _validate_comment(self, status: ReviewStatus, comment: str | None) -> None:
        """Validate that comment is provided when status is COMMENT."""
        if comment is not None and len(comment) > MAX_COMMENT_LENGTH:
            raise ReviewValidationException("Comment exceeds maximum length")
        if status == ReviewStatus.COMMENT and (comment is None or not comment.strip()):
            raise ReviewValidationException("Comment is required for 'comment' status")

    async def create_or_update_review(
        self,
        reviewer_uuid: UUID,
        reviewed_username: str,
        status: ReviewStatus,
        comment: str | None,
        anonymous: bool = False,
    ) -> Review:
        """Create a new review or update existing one (upsert pattern)."""
        comment = sanitize_comment(comment)
        # Validate business rules
        self._validate_comment(status, comment)
        await check_not_self_action(
            self.account_repository,
            reviewer_uuid,
            reviewed_username,
            SelfReviewException,
        )
        await check_target_is_user_type(self.user_repository, reviewed_username)

        # Check for existing review
        existing_review = await self.review_repository.get_by_reviewer_and_username(
            reviewer_uuid, reviewed_username
        )

        now = datetime.now(timezone.utc)

        if existing_review:
            # Block changing anonymous field
            if existing_review.anonymous != anonymous:
                raise AnonymousFieldImmutableException()
            # Update existing review
            existing_review.update_status(status, comment)
            return await self.review_repository.update(existing_review)
        else:
            # Create new review
            new_review = Review(
                id=None,
                reviewer_uuid=reviewer_uuid,
                reviewed_username=reviewed_username,
                status=status,
                comment=comment,
                anonymous=anonymous,
                created_at=now,
                updated_at=now,
            )
            return await self.review_repository.create(new_review)

    async def get_reviews_for_user(
        self,
        reviewed_username: str,
        limit: int = 100,
        offset: int = 0,
        status: str | None = None,
    ) -> list[Review]:
        """Get all reviews for a given username, optionally filtered by status."""
        return await self.review_repository.get_all_for_username(
            reviewed_username, limit, offset, status=status
        )

    async def get_reviews_by_reviewer(
        self, reviewer_uuid: UUID, limit: int = 100, offset: int = 0
    ) -> list[Review]:
        """Get all reviews made by a given reviewer."""
        return await self.review_repository.get_all_by_reviewer_uuid(
            reviewer_uuid, limit, offset
        )

    async def get_review_count_for_username(self, reviewed_username: str) -> int:
        """Get review count for a given username."""
        return await self.review_repository.get_review_count_for_username(
            reviewed_username
        )

    async def get_review_counts_for_usernames(
        self, usernames: list[str]
    ) -> dict[str, int]:
        """Get review counts for multiple usernames at once."""
        return await self.review_repository.get_review_counts_for_usernames(usernames)

    async def delete_review(self, reviewer_uuid: UUID, reviewed_username: str) -> None:
        """Delete a review by reviewer UUID and reviewed username."""
        existing_review = await self.review_repository.get_by_reviewer_and_username(
            reviewer_uuid, reviewed_username
        )
        if existing_review and existing_review.id:
            await self.review_repository.delete(existing_review.id)

    async def delete_reviews_by_reviewer(self, reviewer_uuid: UUID) -> int:
        """Delete all reviews made by a given reviewer. Returns count deleted."""
        return await self.review_repository.delete_all_by_reviewer_uuid(reviewer_uuid)

    async def get_review_by_id(self, review_id: str) -> Review | None:
        """Get a review by its ID."""
        return await self.review_repository.get_by_id(review_id)

    async def update_review(self, review: Review) -> Review:
        """Update an existing review."""
        return await self.review_repository.update(review)
