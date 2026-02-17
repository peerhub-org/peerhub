from uuid import UUID

from app.domain.watchlist.entities.watch import Watch
from app.domain.watchlist.services.watchlist_service import WatchlistService


class WatchUseCase:
    """Use case for watching a user."""

    def __init__(self, watchlist_service: WatchlistService):
        self.watchlist_service = watchlist_service

    async def execute(self, watcher_uuid: UUID, watched_username: str) -> Watch:
        """Watch a user."""
        return await self.watchlist_service.watch(watcher_uuid, watched_username)
