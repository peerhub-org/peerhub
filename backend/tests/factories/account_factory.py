from datetime import datetime
from uuid import uuid4

from app.domain.accounts.entities.account import Account


class AccountFactory:
    """Factory for creating test account entities."""

    @staticmethod
    def create(
        id: str = "test_id",
        username: str = "testuser",
        deleted_at: datetime | None = None,
    ) -> Account:
        """Create a test account entity."""
        return Account(
            id=id,
            uuid=uuid4(),
            username=username,
            deleted_at=deleted_at,
        )
