from typing import Protocol
from uuid import UUID

from app.domain.watchlist.entities.watch import Watch


class IWatchlistRepository(Protocol):
    """Interface for Watch repository (dependency inversion)."""

    async def get_by_watcher_and_username(
        self, watcher_uuid: UUID, watched_username: str
    ) -> Watch | None:
        """Find a watch by watcher UUID and watched username."""
        ...

    async def get_all_by_watcher(
        self, watcher_uuid: UUID, limit: int = 100, offset: int = 0
    ) -> list[Watch]:
        """Get all watching for a user."""
        ...

    async def get_watcher_count(self, watched_username: str) -> int:
        """Get the number of watchers for a username."""
        ...

    async def create(self, watch: Watch) -> Watch:
        """Create a new watch."""
        ...

    async def delete(self, watcher_uuid: UUID, watched_username: str) -> None:
        """Delete a watch."""
        ...

    async def delete_all_by_watcher(self, watcher_uuid: UUID) -> int:
        """Delete all watching for a watcher. Returns count deleted."""
        ...
