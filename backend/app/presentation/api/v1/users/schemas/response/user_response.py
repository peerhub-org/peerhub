from datetime import datetime

from app.domain.users.entities.user import User
from app.presentation.api.v1.shared.schemas.response.base_response import BaseResponse


class UserResponse(BaseResponse):
    """Response schema for GitHub user data."""

    username: str
    name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    type: str | None = None
    created_at: datetime | None = None
    deleted_at: datetime | None = None

    @classmethod
    def from_entity(cls, user: User) -> "UserResponse":
        """Create UserResponse from User entity."""
        return cls(
            username=user.username,
            name=user.name,
            bio=user.bio,
            avatar_url=user.avatar_url,
            type=user.type,
            created_at=user.created_at,
            deleted_at=user.deleted_at,
        )
