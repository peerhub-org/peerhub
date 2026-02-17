from uuid import UUID

from app.domain.watchlist.services.watchlist_service import WatchlistService


class CheckWatchUseCase:
    """Use case for checking watch status."""

    def __init__(self, watchlist_service: WatchlistService):
        self.watchlist_service = watchlist_service

    async def execute(self, watcher_uuid: UUID, watched_username: str) -> bool:
        """Check if the user is watching a username."""
        return await self.watchlist_service.is_watching(watcher_uuid, watched_username)
