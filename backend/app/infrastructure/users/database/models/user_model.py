from datetime import datetime, timezone
from typing import Annotated

from beanie import Document, Indexed
from pydantic import Field


class UserDocument(Document):
    """MongoDB document model for User (infrastructure layer)."""

    username: Annotated[str, Indexed(unique=True)]
    name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    type: str | None = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
