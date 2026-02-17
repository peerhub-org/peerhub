from app.presentation.api.v1.review.schemas.response.review_response import ReviewResponse
from app.presentation.api.v1.shared.schemas.response.base_response import BaseResponse


class PaginatedReviewResponse(BaseResponse):
    """Response schema for paginated review results."""

    items: list[ReviewResponse]
    has_more: bool
