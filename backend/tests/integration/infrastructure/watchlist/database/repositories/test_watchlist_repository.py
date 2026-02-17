from datetime import datetime, timezone
from uuid import uuid4

import pytest

from app.domain.watchlist.entities.watch import Watch
from app.infrastructure.watchlist.database.repositories import (
    mongodb_watchlist_repository,
)


@pytest.mark.asyncio
async def test_watchlist_repository_case_insensitive_username():
    repo = mongodb_watchlist_repository.MongoDBWatchlistRepository()
    watcher_uuid = uuid4()
    watch = Watch(
        id=None,
        watcher_uuid=watcher_uuid,
        watched_username="Alice",
        created_at=datetime.now(timezone.utc),
    )

    await repo.create(watch)
    fetched = await repo.get_by_watcher_and_username(watcher_uuid, "alice")

    assert fetched is not None
    assert fetched.watched_username == "Alice"


@pytest.mark.asyncio
async def test_watchlist_repository_get_all_and_delete():
    repo = mongodb_watchlist_repository.MongoDBWatchlistRepository()
    watcher_uuid = uuid4()
    watch = Watch(
        id=None,
        watcher_uuid=watcher_uuid,
        watched_username="bob",
        created_at=datetime.now(timezone.utc),
    )

    created = await repo.create(watch)
    results = await repo.get_all_by_watcher(watcher_uuid)

    assert len(results) == 1
    assert results[0].id == created.id

    await repo.delete(watcher_uuid, "bob")
    results_after = await repo.get_all_by_watcher(watcher_uuid)
    assert results_after == []
