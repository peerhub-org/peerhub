from dataclasses import dataclass
from uuid import UUID

from app.domain.users.entities.user import User
from app.domain.users.services.user_service import UserService
from app.domain.watchlist.entities.watch import Watch
from app.domain.watchlist.services.watchlist_service import WatchlistService


@dataclass
class WatchWithUser:
    """Watch with associated user profile info."""

    watch: Watch
    user: User | None


class GetWatchlistUseCase:
    """Use case for getting all watches by watcher with user info."""

    def __init__(
        self,
        watchlist_service: WatchlistService,
        user_service: UserService,
    ):
        self.watchlist_service = watchlist_service
        self.user_service = user_service

    async def execute(
        self, watcher_uuid: UUID, limit: int = 100, offset: int = 0
    ) -> list[WatchWithUser]:
        """Get all watching for a user with their profile info."""
        watchlist = await self.watchlist_service.get_watchlist(
            watcher_uuid, limit, offset
        )

        result = []
        for watch in watchlist:
            user = await self.user_service.get_user_by_username(watch.watched_username)
            result.append(WatchWithUser(watch=watch, user=user))

        return result
