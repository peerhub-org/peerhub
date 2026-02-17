from datetime import datetime, timezone
from uuid import UUID

from app.domain.accounts.repositories.account_repository import IAccountRepository
from app.domain.shared.exceptions import SelfWatchException
from app.domain.shared.services.validators import (
    check_not_self_action,
    check_target_is_user_type,
)
from app.domain.users.repositories.user_repository import IUserRepository
from app.domain.watchlist.entities.watch import Watch
from app.domain.watchlist.repositories.watchlist_repository import (
    IWatchlistRepository,
)


class WatchlistService:
    """Domain service for watch business logic."""

    def __init__(
        self,
        watchlist_repository: IWatchlistRepository,
        account_repository: IAccountRepository,
        user_repository: IUserRepository,
    ):
        self.watchlist_repository = watchlist_repository
        self.account_repository = account_repository
        self.user_repository = user_repository

    async def watch(self, watcher_uuid: UUID, watched_username: str) -> Watch:
        """Watch a user. Returns existing watch if already watching."""
        await check_not_self_action(
            self.account_repository,
            watcher_uuid,
            watched_username,
            SelfWatchException,
        )
        await check_target_is_user_type(self.user_repository, watched_username)

        existing = await self.watchlist_repository.get_by_watcher_and_username(
            watcher_uuid, watched_username
        )
        if existing:
            return existing

        watch = Watch(
            id=None,
            watcher_uuid=watcher_uuid,
            watched_username=watched_username,
            created_at=datetime.now(timezone.utc),
        )
        return await self.watchlist_repository.create(watch)

    async def unwatch(self, watcher_uuid: UUID, watched_username: str) -> None:
        """Unwatch a user."""
        await self.watchlist_repository.delete(watcher_uuid, watched_username)

    async def get_watchlist(
        self, watcher_uuid: UUID, limit: int = 100, offset: int = 0
    ) -> list[Watch]:
        """Get all watched users for a watcher."""
        return await self.watchlist_repository.get_all_by_watcher(
            watcher_uuid, limit, offset
        )

    async def is_watching(self, watcher_uuid: UUID, watched_username: str) -> bool:
        """Check if a watcher is watching another user."""
        watch = await self.watchlist_repository.get_by_watcher_and_username(
            watcher_uuid, watched_username
        )
        return watch is not None

    async def delete_all_by_watcher(self, watcher_uuid: UUID) -> int:
        """Delete all watching for a watcher. Returns count deleted."""
        return await self.watchlist_repository.delete_all_by_watcher(watcher_uuid)
