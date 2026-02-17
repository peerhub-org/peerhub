from datetime import datetime, timezone
from uuid import uuid4

import pytest

from app.domain.accounts.entities.account import Account
from app.infrastructure.accounts.database.repositories.mongodb_account_repository import (
    MongoDBAccountRepository,
)


@pytest.mark.asyncio
async def test_account_repository_case_insensitive_username():
    repo = MongoDBAccountRepository()
    account = Account(
        id=None,
        uuid=uuid4(),
        username="Alice",
        access_token="token",
        created_at=datetime.now(timezone.utc),
    )

    created = await repo.create(account)
    fetched = await repo.get_by_username("alice")

    assert fetched is not None
    assert fetched.id == created.id
    assert fetched.username == "Alice"


@pytest.mark.asyncio
async def test_account_repository_get_by_uuid():
    repo = MongoDBAccountRepository()
    account = Account(
        id=None,
        uuid=uuid4(),
        username="bob",
        access_token="token",
        created_at=datetime.now(timezone.utc),
    )

    created = await repo.create(account)
    fetched = await repo.get_by_uuid(created.uuid)

    assert fetched is not None
    assert fetched.id == created.id


@pytest.mark.asyncio
async def test_account_repository_get_by_usernames():
    repo = MongoDBAccountRepository()
    account = Account(
        id=None,
        uuid=uuid4(),
        username="Charlie",
        access_token="token",
        created_at=datetime.now(timezone.utc),
    )

    await repo.create(account)
    fetched = await repo.get_by_usernames(["charlie"])

    assert len(fetched) == 1
    assert fetched[0].username == "Charlie"
