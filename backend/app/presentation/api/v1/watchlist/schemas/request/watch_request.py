from pydantic import BaseModel


class WatchRequest(BaseModel):
    """Request schema for watching a user."""

    username: str
