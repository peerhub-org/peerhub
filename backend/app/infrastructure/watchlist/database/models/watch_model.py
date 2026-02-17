from datetime import datetime
from typing import Annotated
from uuid import UUID

from beanie import Document, Indexed
from pymongo import IndexModel


class WatchDocument(Document):
    """MongoDB document model for Watch (infrastructure layer)."""

    watcher_uuid: Annotated[UUID, Indexed()]
    watched_username: Annotated[str, Indexed()]
    created_at: datetime

    class Settings:
        name = "watchlist"
        indexes = [
            IndexModel(
                [("watcher_uuid", 1), ("watched_username", 1)],
                unique=True,
            ),
            IndexModel([("watched_username", 1)]),
        ]
