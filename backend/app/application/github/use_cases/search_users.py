from uuid import UUID

from app.domain.accounts.services.account_service import AccountService
from app.infrastructure.github.external.github_client import GitHubClient


class SearchUsersUseCase:
    """Use case for searching GitHub users."""

    def __init__(self, account_service: AccountService):
        self.account_service = account_service

    async def execute(self, query: str, current_account_uuid: UUID) -> list[dict]:
        """
        Search GitHub users by query.

        Uses the authenticated user's access token to search GitHub users.
        Returns a list of users with their login and avatar_url.
        """
        account = await self.account_service.get_account_by_uuid(current_account_uuid)
        return await GitHubClient.search_users(query, account.access_token)
