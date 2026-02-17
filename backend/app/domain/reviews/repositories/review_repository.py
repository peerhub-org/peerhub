from typing import Protocol
from uuid import UUID

from app.domain.reviews.entities.review import Review


class IReviewRepository(Protocol):
    """Interface for Review repository (dependency inversion)."""

    async def get_by_id(self, review_id: str) -> Review | None:
        """Find a review by its ID."""
        ...

    async def get_by_reviewer_and_username(
        self, reviewer_uuid: UUID, reviewed_username: str
    ) -> Review | None:
        """Find a review by reviewer UUID and reviewed username."""
        ...

    async def get_all_for_username(
        self,
        reviewed_username: str,
        limit: int = 100,
        offset: int = 0,
        status: str | None = None,
    ) -> list[Review]:
        """Find all reviews for a given username, optionally filtered by status."""
        ...

    async def get_all_by_reviewer_uuid(
        self, reviewer_uuid: UUID, limit: int = 100, offset: int = 0
    ) -> list[Review]:
        """Find all reviews made by a given reviewer."""
        ...

    async def get_review_count_for_username(self, reviewed_username: str) -> int:
        """Get review count for a given username."""
        ...

    async def get_review_counts_for_usernames(
        self, usernames: list[str]
    ) -> dict[str, int]:
        """Get review counts for multiple usernames at once."""
        ...

    async def create(self, review: Review) -> Review:
        """Create a new review."""
        ...

    async def update(self, review: Review) -> Review:
        """Update an existing review."""
        ...

    async def delete(self, review_id: str) -> None:
        """Delete a review by ID."""
        ...

    async def delete_all_by_reviewer_uuid(self, reviewer_uuid: UUID) -> int:
        """Delete all reviews made by a given reviewer. Returns count deleted."""
        ...
