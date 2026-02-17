from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.application.watchlist.use_cases.check_watch import (
    CheckWatchUseCase,
)
from app.domain.watchlist.entities.watch import Watch
from app.domain.watchlist.services.watchlist_service import WatchlistService


@pytest.mark.asyncio
async def test_check_watch_is_watching(
    watchlist_service: WatchlistService,
    mock_watchlist_repository: AsyncMock,
):
    watcher_uuid = uuid4()
    mock_watchlist_repository.get_by_watcher_and_username.return_value = Watch(
        id="sub-1",
        watcher_uuid=watcher_uuid,
        watched_username="targetuser",
        created_at=datetime.now(timezone.utc),
    )

    use_case = CheckWatchUseCase(watchlist_service)
    result = await use_case.execute(watcher_uuid, "targetuser")

    assert result is True


@pytest.mark.asyncio
async def test_check_watch_not_watched(
    watchlist_service: WatchlistService,
    mock_watchlist_repository: AsyncMock,
):
    watcher_uuid = uuid4()
    mock_watchlist_repository.get_by_watcher_and_username.return_value = None

    use_case = CheckWatchUseCase(watchlist_service)
    result = await use_case.execute(watcher_uuid, "otheruser")

    assert result is False
