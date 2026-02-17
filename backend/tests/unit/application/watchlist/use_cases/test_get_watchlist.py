from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.application.watchlist.use_cases.get_watchlist import (
    GetWatchlistUseCase,
)
from app.domain.users.entities.user import User
from app.domain.users.services.user_service import UserService
from app.domain.watchlist.entities.watch import Watch
from app.domain.watchlist.services.watchlist_service import WatchlistService


@pytest.mark.asyncio
async def test_get_watchlist_with_user_info(
    watchlist_service: WatchlistService,
    user_service: UserService,
    mock_watchlist_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    watcher_uuid = uuid4()
    now = datetime.now(timezone.utc)
    watch = Watch(
        id="sub-1",
        watcher_uuid=watcher_uuid,
        watched_username="alice",
        created_at=now,
    )
    user = User(username="alice", avatar_url="https://example.com/alice.png")

    mock_watchlist_repository.get_all_by_watcher.return_value = [watch]
    mock_user_repository.get_by_username.return_value = user

    use_case = GetWatchlistUseCase(watchlist_service, user_service)
    results = await use_case.execute(watcher_uuid, limit=100, offset=0)

    assert len(results) == 1
    assert results[0].watch == watch
    assert results[0].user == user
    assert results[0].user.avatar_url == "https://example.com/alice.png"


@pytest.mark.asyncio
async def test_get_watchlist_empty(
    watchlist_service: WatchlistService,
    user_service: UserService,
    mock_watchlist_repository: AsyncMock,
):
    watcher_uuid = uuid4()
    mock_watchlist_repository.get_all_by_watcher.return_value = []

    use_case = GetWatchlistUseCase(watchlist_service, user_service)
    results = await use_case.execute(watcher_uuid, limit=100, offset=0)

    assert results == []
