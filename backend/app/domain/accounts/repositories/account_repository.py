from typing import Protocol
from uuid import UUID

from app.domain.accounts.entities.account import Account


class IAccountRepository(Protocol):
    """Interface for Account repository (dependency inversion)."""

    async def get_by_username(self, username: str) -> Account | None:
        """Find an account by username."""
        ...

    async def get_by_uuid(self, uuid: UUID) -> Account | None:
        """Find an account by UUID."""
        ...

    async def create(self, account: Account) -> Account:
        """Create a new account."""
        ...

    async def update(self, account: Account) -> Account:
        """Update an existing account."""
        ...

    async def get_by_uuids(self, uuids: list[UUID]) -> list[Account]:
        """Find accounts by a list of UUIDs."""
        ...

    async def get_by_usernames(self, usernames: list[str]) -> list[Account]:
        """Find accounts by a list of usernames."""
        ...

    async def save(self, account: Account) -> Account:
        """Save an account (create or update)."""
        ...
