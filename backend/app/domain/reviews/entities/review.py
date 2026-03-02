from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from uuid import UUID


class ReviewStatus(str, Enum):
    APPROVE = "approve"
    REQUEST_CHANGE = "request_change"
    COMMENT = "comment"


class Role(str, Enum):
    USER = "user"
    MODERATOR = "moderator"


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
    comment_hidden_by: str | None = None

    def update_status(self, new_status: ReviewStatus, new_comment: str | None) -> None:
        """Update the review status and comment (anonymous is immutable)."""
        self.status = new_status
        self.comment = new_comment
        self.updated_at = datetime.now(timezone.utc)

    def set_comment_hidden(self, hidden: bool, hidden_by: str | None = None) -> None:
        """Set whether the comment is hidden and who hid it."""
        self.comment_hidden = hidden
        self.comment_hidden_by = hidden_by
        self.updated_at = datetime.now(timezone.utc)
