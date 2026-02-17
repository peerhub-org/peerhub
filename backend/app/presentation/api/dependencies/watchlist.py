from fastapi import Depends

from app.application.watchlist.use_cases.check_watch import (
    CheckWatchUseCase,
)
from app.application.watchlist.use_cases.get_watchlist import (
    GetWatchlistUseCase,
)
from app.application.watchlist.use_cases.unwatch import UnwatchUseCase
from app.application.watchlist.use_cases.watch import WatchUseCase
from app.domain.users.services.user_service import UserService
from app.domain.watchlist.services.watchlist_service import WatchlistService

from .services import (
    get_user_service,
    get_watchlist_service,
)


def get_watch_use_case(
    watchlist_service: WatchlistService = Depends(get_watchlist_service),
) -> WatchUseCase:
    """Get watch use case instance."""
    return WatchUseCase(watchlist_service)


def get_unwatch_use_case(
    watchlist_service: WatchlistService = Depends(get_watchlist_service),
) -> UnwatchUseCase:
    """Get unwatch use case instance."""
    return UnwatchUseCase(watchlist_service)


def get_all_by_watcher_use_case(
    watchlist_service: WatchlistService = Depends(get_watchlist_service),
    user_service: UserService = Depends(get_user_service),
) -> GetWatchlistUseCase:
    """Get all-by-watcher use case instance."""
    return GetWatchlistUseCase(watchlist_service, user_service)


def get_check_watch_use_case(
    watchlist_service: WatchlistService = Depends(get_watchlist_service),
) -> CheckWatchUseCase:
    """Get check watch use case instance."""
    return CheckWatchUseCase(watchlist_service)
