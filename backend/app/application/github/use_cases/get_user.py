from datetime import datetime, timezone
from uuid import UUID

from app.domain.accounts.entities.account import Account
from app.domain.accounts.services.account_service import AccountService
from app.domain.users.entities.user import User
from app.domain.users.services.user_service import UserService
from app.infrastructure.github.external.github_client import GitHubClient


class GetUserUseCase:
    """Use case for fetching a GitHub user, with optional cache bypass."""

    def __init__(
        self,
        account_service: AccountService,
        user_service: UserService,
    ):
        self.account_service = account_service
        self.user_service = user_service

    async def execute(
        self,
        username: str,
        current_account_uuid: UUID,
        force_refresh: bool = False,
    ) -> User:
        """
        Fetch a GitHub user by username.

        If force_refresh is False, checks the local cache first.
        If the user is not found or the cache is older than 7 days
        (or force_refresh is True), fetches fresh data from GitHub.
        """
        cached_user = await self.user_service.get_user_by_username(username)

        if (
            not force_refresh
            and cached_user is not None
            and not self.user_service.is_cache_expired(cached_user)
        ):
            target_account = await self.account_service.get_account_by_username(username)
            if target_account:
                cached_user.created_at = target_account.created_at
                cached_user.deleted_at = target_account.deleted_at
            return cached_user

        account = await self.account_service.get_account_by_uuid(current_account_uuid)
        github_data = await GitHubClient.fetch_user_by_username(
            username, account.access_token
        )

        target_account = await self.account_service.get_account_by_username(username)

        user = self._build_user_from_github_data(github_data, cached_user, target_account)

        saved_user = await self.user_service.save_user(user)
        if target_account:
            # Ensure response includes account lifecycle fields.
            saved_user.created_at = target_account.created_at
            saved_user.deleted_at = target_account.deleted_at
        return saved_user

    @staticmethod
    def _build_user_from_github_data(
        github_data: dict,
        cached_user: User | None,
        target_account: Account | None,
    ) -> User:
        """Build a User entity from GitHub API data."""
        return User(
            id=cached_user.id if cached_user else None,
            username=github_data["username"],
            name=github_data.get("name"),
            bio=github_data.get("bio"),
            avatar_url=github_data.get("avatar_url"),
            type=github_data.get("type"),
            updated_at=datetime.now(timezone.utc),
            created_at=(target_account.created_at if target_account else None),
            deleted_at=(target_account.deleted_at if target_account else None),
        )
