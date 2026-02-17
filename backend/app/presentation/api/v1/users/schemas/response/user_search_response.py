from app.presentation.api.v1.shared.schemas.response.base_response import BaseResponse
from app.presentation.api.v1.users.schemas.response.user_search_item import UserSearchItem


class UserSearchResponse(BaseResponse):
    """Response schema for GitHub user search results."""

    users: list[UserSearchItem]
