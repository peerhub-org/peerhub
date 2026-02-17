from pydantic import BaseModel, Field, ValidationInfo, field_validator

from app.domain.reviews.entities.review import ReviewStatus
from app.domain.reviews.services.comment_sanitizer import sanitize_comment


class CreateOrUpdateReviewRequest(BaseModel):
    """Request schema for creating or updating a review."""

    reviewed_username: str
    status: ReviewStatus
    comment: str | None = Field(default=None, max_length=1024)
    anonymous: bool = False

    @field_validator("comment")
    @classmethod
    def validate_comment(cls, v: str | None, info: ValidationInfo) -> str | None:
        """Validate that comment is provided when status is COMMENT."""
        sanitized = sanitize_comment(v)
        if info.data.get("status") == ReviewStatus.COMMENT and sanitized is None:
            raise ValueError("Comment is required")
        return sanitized
