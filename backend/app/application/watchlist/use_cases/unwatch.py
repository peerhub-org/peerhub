from uuid import UUID

from app.domain.watchlist.services.watchlist_service import WatchlistService


class UnwatchUseCase:
    """Use case for unwatching a user."""

    def __init__(self, watchlist_service: WatchlistService):
        self.watchlist_service = watchlist_service

    async def execute(self, watcher_uuid: UUID, watched_username: str) -> None:
        """Unwatch a user."""
        await self.watchlist_service.unwatch(watcher_uuid, watched_username)
