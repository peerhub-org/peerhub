from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class Watch:
    """Pure domain entity for Watch (no infrastructure dependencies)."""

    id: str | None
    watcher_uuid: UUID  # The user who is watching
    watched_username: str  # The username being watched
    created_at: datetime
