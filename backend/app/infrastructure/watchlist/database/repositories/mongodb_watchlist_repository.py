from uuid import UUID

from beanie import SortDirection

from app.domain.watchlist.entities.watch import Watch
from app.infrastructure.shared.database.constants import CASE_INSENSITIVE
from app.infrastructure.shared.database.repositories.base_repository import BaseRepository
from app.infrastructure.watchlist.database.mappers.watch_mapper import (
    WatchMapper,
)
from app.infrastructure.watchlist.database.models.watch_model import (
    WatchDocument,
)


class MongoDBWatchlistRepository(BaseRepository[Watch, WatchDocument]):
    """MongoDB implementation of IWatchlistRepository interface."""

    document_class = WatchDocument
    mapper = WatchMapper

    async def get_by_watcher_and_username(
        self, watcher_uuid: UUID, watched_username: str
    ) -> Watch | None:
        """Find a watch by watcher UUID and watched username."""
        document = await WatchDocument.find_one(
            {
                "watcher_uuid": watcher_uuid,
                "watched_username": watched_username,
            },
            collation=CASE_INSENSITIVE,
        )
        if document is None:
            return None
        return WatchMapper.to_entity(document)

    async def get_all_by_watcher(
        self, watcher_uuid: UUID, limit: int = 100, offset: int = 0
    ) -> list[Watch]:
        """Get all watching for a user."""
        documents = (
            await WatchDocument.find({"watcher_uuid": watcher_uuid})
            .sort([("created_at", SortDirection.DESCENDING)])
            .skip(offset)
            .limit(limit)
            .to_list()
        )
        return [WatchMapper.to_entity(doc) for doc in documents]

    async def get_watcher_count(self, watched_username: str) -> int:
        """Get the number of watchers for a username."""
        return await WatchDocument.find(
            {"watched_username": watched_username},
            collation=CASE_INSENSITIVE,
        ).count()

    async def delete(self, watcher_uuid: UUID, watched_username: str) -> None:
        """Delete a watch."""
        document = await WatchDocument.find_one(
            {
                "watcher_uuid": watcher_uuid,
                "watched_username": watched_username,
            },
            collation=CASE_INSENSITIVE,
        )
        if document:
            await document.delete()

    async def delete_all_by_watcher(self, watcher_uuid: UUID) -> int:
        """Delete all watching for a watcher. Returns count deleted."""
        result = await WatchDocument.find({"watcher_uuid": watcher_uuid}).delete()
        return result.deleted_count if result else 0
