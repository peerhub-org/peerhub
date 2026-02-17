from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import UUID

import pytest
from httpx import AsyncClient

from app.application.watchlist.use_cases.get_watchlist import WatchWithUser
from app.domain.users.entities.user import User
from app.domain.watchlist.entities.watch import Watch
from app.main import app
from app.presentation.api.dependencies import (
    get_all_by_watcher_use_case,
    get_check_watch_use_case,
    get_unwatch_use_case,
    get_watch_use_case,
)


@pytest.mark.asyncio
async def test_watch(async_client: AsyncClient, auth_uuid: UUID):
    watch = Watch(
        id="s1",
        watcher_uuid=auth_uuid,
        watched_username="bob",
        created_at=datetime.now(timezone.utc),
    )
    mock_use_case = AsyncMock()
    mock_use_case.execute.return_value = watch
    app.dependency_overrides[get_watch_use_case] = lambda: mock_use_case

    response = await async_client.post(
        "/api/v1/watchlist",
        json={"username": "bob"},
    )

    assert response.status_code == 201
    assert response.json()["message"] == "Watched successfully"


@pytest.mark.asyncio
async def test_unwatch(async_client: AsyncClient, auth_uuid: UUID):
    mock_use_case = AsyncMock()
    mock_use_case.execute.return_value = None
    app.dependency_overrides[get_unwatch_use_case] = lambda: mock_use_case

    response = await async_client.delete("/api/v1/watchlist/bob")

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_get_watchlist(async_client: AsyncClient, auth_uuid: UUID):
    watch = Watch(
        id="s1",
        watcher_uuid=auth_uuid,
        watched_username="bob",
        created_at=datetime.now(timezone.utc),
    )
    user = User(username="bob", name="Bob", avatar_url="https://example.com/bob.png")
    watch_with_user = WatchWithUser(watch=watch, user=user)

    mock_use_case = AsyncMock()
    mock_use_case.execute.return_value = [watch_with_user]
    app.dependency_overrides[get_all_by_watcher_use_case] = lambda: mock_use_case

    response = await async_client.get("/api/v1/watchlist")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["watched_username"] == "bob"


@pytest.mark.asyncio
async def test_check_watch(async_client: AsyncClient, auth_uuid: UUID):
    mock_use_case = AsyncMock()
    mock_use_case.execute.return_value = True
    app.dependency_overrides[get_check_watch_use_case] = lambda: mock_use_case

    response = await async_client.get("/api/v1/watchlist/check/bob")

    assert response.status_code == 200
    assert response.json()["is_watching"] is True
