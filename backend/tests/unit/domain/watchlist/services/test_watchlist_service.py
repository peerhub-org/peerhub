from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.domain.accounts.entities.account import Account
from app.domain.shared.exceptions import NotUserTypeException, SelfWatchException
from app.domain.users.entities.user import User
from app.domain.watchlist.entities.watch import Watch
from app.domain.watchlist.services.watchlist_service import WatchlistService


@pytest.mark.asyncio
async def test_watch_new(
    watchlist_service: WatchlistService,
    mock_watchlist_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    watcher_uuid = uuid4()
    mock_account_repository.get_by_uuid.return_value = Account(
        id="a1", uuid=watcher_uuid, username="alice", access_token="t"
    )
    mock_user_repository.get_by_username.return_value = None
    mock_watchlist_repository.get_by_watcher_and_username.return_value = None
    mock_watchlist_repository.create.side_effect = lambda s: s

    result = await watchlist_service.watch(watcher_uuid, "bob")

    assert result.watched_username == "bob"
    mock_watchlist_repository.create.assert_called_once()


@pytest.mark.asyncio
async def test_watch_existing(
    watchlist_service: WatchlistService,
    mock_watchlist_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    watcher_uuid = uuid4()
    existing = Watch(
        id="s1",
        watcher_uuid=watcher_uuid,
        watched_username="bob",
        created_at=datetime.now(timezone.utc),
    )
    mock_account_repository.get_by_uuid.return_value = Account(
        id="a1", uuid=watcher_uuid, username="alice", access_token="t"
    )
    mock_user_repository.get_by_username.return_value = None
    mock_watchlist_repository.get_by_watcher_and_username.return_value = existing

    result = await watchlist_service.watch(watcher_uuid, "bob")

    assert result.id == "s1"
    mock_watchlist_repository.create.assert_not_called()


@pytest.mark.asyncio
async def test_self_watch_raises(
    watchlist_service: WatchlistService,
    mock_account_repository: AsyncMock,
):
    watcher_uuid = uuid4()
    mock_account_repository.get_by_uuid.return_value = Account(
        id="a1", uuid=watcher_uuid, username="alice", access_token="t"
    )

    with pytest.raises(SelfWatchException):
        await watchlist_service.watch(watcher_uuid, "Alice")


@pytest.mark.asyncio
async def test_unwatch(
    watchlist_service: WatchlistService,
    mock_watchlist_repository: AsyncMock,
):
    watcher_uuid = uuid4()

    await watchlist_service.unwatch(watcher_uuid, "bob")

    mock_watchlist_repository.delete.assert_called_once_with(watcher_uuid, "bob")


@pytest.mark.asyncio
async def test_get_watchlist(
    watchlist_service: WatchlistService,
    mock_watchlist_repository: AsyncMock,
    sample_watch: Watch,
):
    mock_watchlist_repository.get_all_by_watcher.return_value = [sample_watch]

    result = await watchlist_service.get_watchlist(sample_watch.watcher_uuid)

    assert len(result) == 1
    assert result[0].id == sample_watch.id


@pytest.mark.asyncio
async def test_is_watching_true(
    watchlist_service: WatchlistService,
    mock_watchlist_repository: AsyncMock,
    sample_watch: Watch,
):
    mock_watchlist_repository.get_by_watcher_and_username.return_value = sample_watch

    result = await watchlist_service.is_watching(
        sample_watch.watcher_uuid, "followeduser"
    )

    assert result is True


@pytest.mark.asyncio
async def test_is_watching_false(
    watchlist_service: WatchlistService,
    mock_watchlist_repository: AsyncMock,
):
    mock_watchlist_repository.get_by_watcher_and_username.return_value = None

    result = await watchlist_service.is_watching(uuid4(), "nobody")

    assert result is False


@pytest.mark.asyncio
async def test_watch_non_user_type_raises(
    watchlist_service: WatchlistService,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    watcher_uuid = uuid4()
    mock_account_repository.get_by_uuid.return_value = Account(
        id="a1", uuid=watcher_uuid, username="alice", access_token="t"
    )
    mock_user_repository.get_by_username.return_value = User(
        username="some-org", type="Organization"
    )

    with pytest.raises(NotUserTypeException):
        await watchlist_service.watch(watcher_uuid, "some-org")


@pytest.mark.asyncio
async def test_watch_user_type_allowed(
    watchlist_service: WatchlistService,
    mock_watchlist_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    watcher_uuid = uuid4()
    mock_account_repository.get_by_uuid.return_value = Account(
        id="a1", uuid=watcher_uuid, username="alice", access_token="t"
    )
    mock_user_repository.get_by_username.return_value = User(username="bob", type="User")
    mock_watchlist_repository.get_by_watcher_and_username.return_value = None
    mock_watchlist_repository.create.side_effect = lambda s: s

    result = await watchlist_service.watch(watcher_uuid, "bob")

    assert result.watched_username == "bob"
    mock_watchlist_repository.create.assert_called_once()
