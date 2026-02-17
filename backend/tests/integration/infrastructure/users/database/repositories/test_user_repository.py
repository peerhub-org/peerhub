from datetime import datetime, timezone

import pytest

from app.domain.users.entities.user import User
from app.infrastructure.users.database.repositories.mongodb_user_repository import (
    MongoDBUserRepository,
)


@pytest.mark.asyncio
async def test_user_repository_case_insensitive_username():
    repo = MongoDBUserRepository()
    user = User(
        id="507f1f77bcf86cd799439011",
        username="Alice",
        name="Alice",
        bio="Hi",
        avatar_url="https://example.com/a.png",
        type="User",
        updated_at=datetime.now(timezone.utc),
    )

    await repo.create(user)
    fetched = await repo.get_by_username("alice")

    assert fetched is not None
    assert fetched.username == "Alice"
