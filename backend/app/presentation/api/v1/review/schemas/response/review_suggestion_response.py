from pydantic import BaseModel


class ReviewSuggestionResponse(BaseModel):
    """Response schema for review suggestion."""

    username: str
    avatar_url: str | None
