from datetime import datetime

from app.application.watchlist.use_cases.get_watchlist import WatchWithUser
from app.presentation.api.v1.shared.schemas.response.base_response import BaseResponse


class WatchResponse(BaseResponse):
    """Response schema for a watch."""

    id: str
    watched_username: str
    watched_avatar_url: str | None
    watched_name: str | None
    created_at: datetime

    @classmethod
    def from_watch_with_user(cls, swu: WatchWithUser) -> "WatchResponse":
        """Create response from WatchWithUser."""
        watch = swu.watch
        if watch.id is None:
            raise ValueError("Watch must have an id")
        return cls(
            id=watch.id,
            watched_username=watch.watched_username,
            watched_avatar_url=swu.user.avatar_url if swu.user else None,
            watched_name=swu.user.name if swu.user else None,
            created_at=watch.created_at,
        )
