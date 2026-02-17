from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.application.github.use_cases.get_user import GetUserUseCase
from app.domain.accounts.entities.account import Account
from app.domain.accounts.services.account_service import AccountService
from app.domain.users.entities.user import User
from app.domain.users.services.user_service import UserService


@pytest.mark.asyncio
async def test_get_user_persists_user_type(
    account_service: AccountService,
    user_service: UserService,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    account_uuid = uuid4()
    mock_account_repository.get_by_uuid.return_value = Account(
        id="a1", uuid=account_uuid, username="me", access_token="token"
    )
    mock_account_repository.get_by_username.return_value = None
    mock_user_repository.get_by_username.return_value = None
    mock_user_repository.save.side_effect = lambda u: u

    github_data = {
        "username": "alice",
        "name": "Alice",
        "bio": "dev",
        "avatar_url": "https://example.com/alice.png",
        "type": "User",
    }

    with patch(
        "app.application.github.use_cases.get_user.GitHubClient.fetch_user_by_username",
        return_value=github_data,
    ):
        use_case = GetUserUseCase(account_service, user_service)
        result = await use_case.execute("alice", account_uuid)

    assert result.type == "User"
    mock_user_repository.save.assert_called_once()
    saved_user = mock_user_repository.save.call_args[0][0]
    assert saved_user.type == "User"


@pytest.mark.asyncio
async def test_get_user_persists_organization_type(
    account_service: AccountService,
    user_service: UserService,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    account_uuid = uuid4()
    mock_account_repository.get_by_uuid.return_value = Account(
        id="a1", uuid=account_uuid, username="me", access_token="token"
    )
    mock_account_repository.get_by_username.return_value = None
    mock_user_repository.get_by_username.return_value = None
    mock_user_repository.save.side_effect = lambda u: u

    github_data = {
        "username": "some-org",
        "name": "Some Org",
        "bio": None,
        "avatar_url": "https://example.com/org.png",
        "type": "Organization",
    }

    with patch(
        "app.application.github.use_cases.get_user.GitHubClient.fetch_user_by_username",
        return_value=github_data,
    ):
        use_case = GetUserUseCase(account_service, user_service)
        result = await use_case.execute("some-org", account_uuid)

    assert result.type == "Organization"
    mock_user_repository.save.assert_called_once()
    saved_user = mock_user_repository.save.call_args[0][0]
    assert saved_user.type == "Organization"


@pytest.mark.asyncio
async def test_get_user_returns_cached_with_type(
    account_service: AccountService,
    user_service: UserService,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    account_uuid = uuid4()
    cached_user = User(
        id="u1",
        username="alice",
        name="Alice",
        type="User",
        updated_at=datetime.now(timezone.utc),
    )
    mock_user_repository.get_by_username.return_value = cached_user
    mock_account_repository.get_by_username.return_value = None

    use_case = GetUserUseCase(account_service, user_service)
    result = await use_case.execute("alice", account_uuid)

    assert result.type == "User"
    mock_user_repository.save.assert_not_called()
