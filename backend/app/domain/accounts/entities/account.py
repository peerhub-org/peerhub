from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID


@dataclass
class Account:
    """Pure domain entity for Account (no infrastructure dependencies)."""

    id: str | None
    uuid: UUID
    username: str
    access_token: str
    email: str | None = None
    created_at: datetime | None = None
    deleted_at: datetime | None = None

    def delete(self) -> None:
        """Delete this account and clear access token."""
        self.deleted_at = datetime.now(timezone.utc)
        self.access_token = ""

    def activate(self) -> None:
        """Activate this account."""
        self.deleted_at = None
