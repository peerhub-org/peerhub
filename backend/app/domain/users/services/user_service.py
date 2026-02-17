from datetime import datetime, timedelta, timezone

from app.domain.shared.constants import CACHE_EXPIRY_DAYS
from app.domain.users.entities.user import User
from app.domain.users.repositories.user_repository import IUserRepository


class UserService:
    """Domain service for user business logic."""

    def __init__(self, user_repository: IUserRepository):
        self.user_repository = user_repository

    async def get_user_by_username(self, username: str) -> User | None:
        """Get a user by username from the repository."""
        return await self.user_repository.get_by_username(username)

    async def get_users_by_usernames(self, usernames: list[str]) -> dict[str, User]:
        """Get users by usernames, returned as a dict keyed by lowercase username."""
        users = await self.user_repository.get_by_usernames(usernames)
        return {u.username.lower(): u for u in users}

    async def save_user(self, user: User) -> User:
        """Save a user to the repository."""
        return await self.user_repository.save(user)

    def is_cache_expired(self, user: User) -> bool:
        """Check if the user cache is expired (older than 7 days)."""
        if user.updated_at is None:
            return True
        expiry_date = user.updated_at.replace(tzinfo=timezone.utc) + timedelta(
            days=CACHE_EXPIRY_DAYS
        )
        return datetime.now(timezone.utc) > expiry_date
