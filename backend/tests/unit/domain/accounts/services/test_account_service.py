from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.domain.accounts.entities.account import Account
from app.domain.accounts.services.account_service import AccountService
from app.domain.shared.exceptions import AccountNotFoundException


@pytest.mark.asyncio
async def test_get_account_by_uuid_found(
    account_service: AccountService,
    mock_account_repository: AsyncMock,
    sample_account: Account,
):
    mock_account_repository.get_by_uuid.return_value = sample_account
    result = await account_service.get_account_by_uuid(sample_account.uuid)
    assert result.uuid == sample_account.uuid
    mock_account_repository.get_by_uuid.assert_called_once_with(sample_account.uuid)


@pytest.mark.asyncio
async def test_get_account_by_uuid_not_found(
    account_service: AccountService,
    mock_account_repository: AsyncMock,
):
    mock_account_repository.get_by_uuid.return_value = None
    test_uuid = uuid4()
    with pytest.raises(AccountNotFoundException):
        await account_service.get_account_by_uuid(test_uuid)


@pytest.mark.asyncio
async def test_get_active_account_by_uuid_deleted(
    account_service: AccountService,
    mock_account_repository: AsyncMock,
    sample_account: Account,
):
    from datetime import datetime, timezone

    sample_account.deleted_at = datetime.now(timezone.utc)
    mock_account_repository.get_by_uuid.return_value = sample_account
    with pytest.raises(AccountNotFoundException):
        await account_service.get_active_account_by_uuid(sample_account.uuid)


@pytest.mark.asyncio
async def test_delete_account(
    account_service: AccountService,
    mock_account_repository: AsyncMock,
    sample_account: Account,
):
    mock_account_repository.update.return_value = sample_account
    await account_service.delete_account(sample_account)
    assert sample_account.deleted_at is not None
    assert sample_account.access_token == ""
    mock_account_repository.update.assert_called_once()


@pytest.mark.asyncio
async def test_get_or_create_account_existing(
    account_service: AccountService,
    mock_account_repository: AsyncMock,
    sample_account: Account,
):
    mock_account_repository.get_by_username.return_value = sample_account
    mock_account_repository.update.return_value = sample_account
    result = await account_service.get_or_create_account("testuser", "new-token")
    assert result.access_token == "new-token"


@pytest.mark.asyncio
async def test_get_or_create_account_new(
    account_service: AccountService,
    mock_account_repository: AsyncMock,
):
    mock_account_repository.get_by_username.return_value = None
    new_account = Account(
        id="new-id",
        uuid=uuid4(),
        username="newuser",
        access_token="token",
    )
    mock_account_repository.create.return_value = new_account
    result = await account_service.get_or_create_account("newuser", "token")
    assert result.username == "newuser"
    mock_account_repository.create.assert_called_once()
