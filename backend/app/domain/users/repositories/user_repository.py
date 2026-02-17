from typing import Protocol

from app.domain.users.entities.user import User


class IUserRepository(Protocol):
    """Interface for User repository (dependency inversion)."""

    async def get_by_username(self, username: str) -> User | None:
        """Find a user by username."""
        ...

    async def get_by_usernames(self, usernames: list[str]) -> list[User]:
        """Find users by a list of usernames."""
        ...

    async def create(self, user: User) -> User:
        """Create a new user."""
        ...

    async def update(self, user: User) -> User:
        """Update an existing user."""
        ...

    async def save(self, user: User) -> User:
        """Save a user (create or update)."""
        ...
