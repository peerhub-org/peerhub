from app.presentation.api.v1.shared.schemas.response.base_response import BaseResponse


class WatchStatusResponse(BaseResponse):
    """Response schema for watch status check."""

    is_watching: bool
