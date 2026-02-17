from dataclasses import dataclass
from datetime import datetime


@dataclass
class User:
    """Domain entity representing a GitHub user."""

    username: str
    id: str | None = None
    name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    type: str | None = None
    updated_at: datetime | None = None
    created_at: datetime | None = None
    deleted_at: datetime | None = None

    @property
    def is_user_type(self) -> bool:
        """Check if this is a regular User (not Organization or Bot)."""
        return self.type == "User"
