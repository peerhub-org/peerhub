from datetime import datetime
from typing import Annotated
from uuid import UUID

from beanie import Document, Indexed
from pydantic import Field
from pymongo import IndexModel

from app.domain.reviews.entities.review import ReviewStatus


class ReviewDocument(Document):
    """MongoDB document model for Review (infrastructure layer)."""

    reviewer_uuid: Annotated[UUID, Indexed()]
    reviewed_username: Annotated[str, Indexed()]
    status: ReviewStatus
    comment: str | None = Field(default=None, max_length=1024)
    anonymous: bool = False
    created_at: datetime
    updated_at: datetime
    comment_hidden: bool = False

    class Settings:
        name = "reviews"
        indexes = [
            IndexModel(
                [("reviewer_uuid", 1), ("reviewed_username", 1)],
                unique=True,
            ),
            IndexModel(
                [("reviewed_username", 1), ("created_at", -1)],
            ),
        ]
