from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from uuid import UUID


class ReviewStatus(str, Enum):
    APPROVE = "approve"
    REQUEST_CHANGE = "request_change"
    COMMENT = "comment"


@dataclass
class Review:
    """Pure domain entity for Review (no infrastructure dependencies)."""

    id: str | None
    reviewer_uuid: UUID
    reviewed_username: str
    status: ReviewStatus
    comment: str | None
    anonymous: bool
    created_at: datetime
    updated_at: datetime
    comment_hidden: bool = False

    def update_status(self, new_status: ReviewStatus, new_comment: str | None) -> None:
        """Update the review status and comment (anonymous is immutable)."""
        self.status = new_status
        self.comment = new_comment
        self.updated_at = datetime.now(timezone.utc)

    def set_comment_hidden(self, hidden: bool) -> None:
        """Set whether the comment is hidden (only page owner can do this)."""
        self.comment_hidden = hidden
        self.updated_at = datetime.now(timezone.utc)
