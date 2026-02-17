from app.presentation.api.v1.shared.schemas.response.base_response import BaseResponse


class UserSearchItem(BaseResponse):
    """Response schema for a single GitHub user search result."""

    login: str
    avatar_url: str
    type: str | None = None
