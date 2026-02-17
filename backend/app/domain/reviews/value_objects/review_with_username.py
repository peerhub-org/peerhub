from dataclasses import dataclass

from app.domain.reviews.entities.review import Review


@dataclass
class ReviewWithUsername:
    """Review with resolved reviewer username and avatar."""

    review: Review
    reviewer_username: str
    reviewer_avatar_url: str | None
