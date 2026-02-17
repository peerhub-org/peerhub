from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.application.github.use_cases.authenticate_with_github import (
    AuthenticateWithGitHubUseCase,
)
from app.domain.accounts.entities.account import Account
from app.domain.accounts.services.account_service import AccountService
from app.domain.shared.exceptions import AccessRestrictedException
from app.domain.users.services.user_service import UserService

GITHUB_DATA = {
    "username": "alice",
    "name": "Alice",
    "bio": "dev",
    "avatar_url": "https://example.com/alice.png",
    "type": "User",
}


@pytest.mark.asyncio
async def test_authenticate_creates_user_record(
    account_service: AccountService,
    user_service: UserService,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    account = Account(
        id="a1", uuid=uuid4(), username="alice", access_token="token123"
    )
    mock_account_repository.get_by_username.return_value = account
    mock_account_repository.update.return_value = account
    mock_user_repository.save.side_effect = lambda u: u

    with patch(
        "app.application.github.use_cases.authenticate_with_github.GitHubClient.fetch_github_user_data",
        return_value=(GITHUB_DATA, "token123"),
    ), patch(
        "app.application.github.use_cases.authenticate_with_github.settings",
    ) as mock_settings:
        mock_settings.ALLOWED_USERNAMES = []
        use_case = AuthenticateWithGitHubUseCase(account_service, user_service)
        result = await use_case.execute("code123")

    assert result.username == "alice"
    mock_user_repository.save.assert_called_once()
    saved_user = mock_user_repository.save.call_args[0][0]
    assert saved_user.username == "alice"
    assert saved_user.name == "Alice"
    assert saved_user.avatar_url == "https://example.com/alice.png"
    assert saved_user.type == "User"


@pytest.mark.asyncio
async def test_authenticate_does_not_save_user_when_access_restricted(
    account_service: AccountService,
    user_service: UserService,
    mock_user_repository: AsyncMock,
):
    with patch(
        "app.application.github.use_cases.authenticate_with_github.GitHubClient.fetch_github_user_data",
        return_value=(GITHUB_DATA, "token123"),
    ), patch(
        "app.application.github.use_cases.authenticate_with_github.settings",
    ) as mock_settings:
        mock_settings.ALLOWED_USERNAMES = ["bob"]
        use_case = AuthenticateWithGitHubUseCase(account_service, user_service)
        with pytest.raises(AccessRestrictedException):
            await use_case.execute("code123")

    mock_user_repository.save.assert_not_called()
