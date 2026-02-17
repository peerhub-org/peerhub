from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.application.watchlist.use_cases.unwatch import UnwatchUseCase
from app.domain.watchlist.services.watchlist_service import WatchlistService


@pytest.mark.asyncio
async def test_unwatch_happy_path(
    watchlist_service: WatchlistService,
    mock_watchlist_repository: AsyncMock,
):
    watcher_uuid = uuid4()

    use_case = UnwatchUseCase(watchlist_service)
    await use_case.execute(watcher_uuid, "targetuser")

    mock_watchlist_repository.delete.assert_called_once_with(watcher_uuid, "targetuser")
