from datetime import datetime, timedelta, timezone

import pytest

from app.domain.users.entities.user import User
from app.domain.users.services.user_service import UserService


@pytest.mark.asyncio
async def test_get_user_by_username(
    user_service: UserService,
    mock_user_repository,
    sample_user: User,
):
    mock_user_repository.get_by_username.return_value = sample_user

    result = await user_service.get_user_by_username("testuser")

    assert result is not None
    assert result.username == "testuser"
    mock_user_repository.get_by_username.assert_called_once_with("testuser")


@pytest.mark.asyncio
async def test_save_user(
    user_service: UserService,
    mock_user_repository,
    sample_user: User,
):
    mock_user_repository.save.return_value = sample_user

    result = await user_service.save_user(sample_user)

    assert result.username == "testuser"
    mock_user_repository.save.assert_called_once_with(sample_user)


def test_cache_expired_no_updated_at(user_service: UserService):
    user = User(username="alice", updated_at=None)
    assert user_service.is_cache_expired(user) is True


def test_cache_expired_old(user_service: UserService):
    user = User(
        username="alice",
        updated_at=datetime.now(timezone.utc) - timedelta(days=8),
    )
    assert user_service.is_cache_expired(user) is True


def test_cache_not_expired(user_service: UserService):
    user = User(
        username="alice",
        updated_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    assert user_service.is_cache_expired(user) is False
