from datetime import datetime
from typing import Annotated
from uuid import UUID, uuid4

from beanie import Document, Indexed
from pydantic import Field


class AccountDocument(Document):
    """MongoDB document model for Account (infrastructure layer)."""

    uuid: Annotated[UUID, Field(default_factory=uuid4), Indexed(unique=True)]
    username: Annotated[str, Indexed(unique=True)]
    access_token: str
    email: str | None = None
    deleted_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "accounts"
