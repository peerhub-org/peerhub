from app.presentation.api.v1.shared.schemas.response.base_response import BaseResponse

from .activity_feed_item_response import ActivityFeedItemResponse


class PaginatedActivityFeedResponse(BaseResponse):
    """Paginated response for activity feed."""

    items: list[ActivityFeedItemResponse]
    has_more: bool
