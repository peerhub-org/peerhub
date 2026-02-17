from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.application.watchlist.use_cases.watch import WatchUseCase
from app.domain.accounts.entities.account import Account
from app.domain.users.entities.user import User
from app.domain.watchlist.entities.watch import Watch
from app.domain.watchlist.services.watchlist_service import WatchlistService


@pytest.mark.asyncio
async def test_watch_happy_path(
    watchlist_service: WatchlistService,
    mock_watchlist_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    watcher_uuid = uuid4()
    now = datetime.now(timezone.utc)
    watch = Watch(
        id="sub-1",
        watcher_uuid=watcher_uuid,
        watched_username="targetuser",
        created_at=now,
    )

    # Validator: check_not_self_action
    mock_account_repository.get_by_uuid.return_value = Account(
        id="a1", uuid=watcher_uuid, username="watcher", access_token="t"
    )
    # Validator: check_target_is_user_type
    mock_user_repository.get_by_username.return_value = User(
        username="targetuser", type="User"
    )
    # No existing watch
    mock_watchlist_repository.get_by_watcher_and_username.return_value = None
    mock_watchlist_repository.create.return_value = watch

    use_case = WatchUseCase(watchlist_service)
    result = await use_case.execute(watcher_uuid, "targetuser")

    assert result == watch
    assert result.watcher_uuid == watcher_uuid
    assert result.watched_username == "targetuser"
