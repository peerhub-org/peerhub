from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.application.accounts.use_cases.delete_account import DeleteAccountUseCase
from app.application.accounts.use_cases.get_activity_feed import (
    GetActivityFeedUseCase,
)
from app.application.accounts.use_cases.get_current_account import (
    GetCurrentAccountUseCase,
)
from app.application.reviews.use_cases.get_my_reviews import GetMyReviewsUseCase
from app.presentation.api.dependencies.accounts import (
    get_activity_feed_use_case,
    get_current_account_use_case,
    get_delete_account_use_case,
    get_my_reviews_use_case,
)
from app.presentation.api.dependencies.auth import get_current_account_uuid
from app.presentation.api.v1.account.schemas.response import (
    AccountResponse,
    ActivityFeedItemResponse,
    PaginatedActivityFeedResponse,
)
from app.presentation.api.v1.review.schemas.response import ReviewResponse

router = APIRouter()


@router.get("", response_model=AccountResponse)
async def get_current_account(
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: GetCurrentAccountUseCase = Depends(get_current_account_use_case),
) -> AccountResponse:
    """Get the current authenticated account."""
    account = await use_case.execute(account_uuid)
    return AccountResponse.from_entity(account)


@router.delete("", response_model=AccountResponse)
async def delete_account(
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: DeleteAccountUseCase = Depends(get_delete_account_use_case),
) -> AccountResponse:
    """Delete the current account."""
    account = await use_case.execute(account_uuid)
    return AccountResponse.from_entity(account)


@router.get("/reviews", response_model=list[ReviewResponse])
async def get_my_reviews(
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: GetMyReviewsUseCase = Depends(get_my_reviews_use_case),
) -> list[ReviewResponse]:
    """Get all reviews made by the current authenticated user."""
    reviews_with_usernames = await use_case.execute(account_uuid)
    return [
        ReviewResponse.from_entity(r.review, r.reviewer_username, r.reviewer_avatar_url)
        for r in reviews_with_usernames
    ]


@router.get("/feed", response_model=PaginatedActivityFeedResponse)
async def get_activity_feed(
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: GetActivityFeedUseCase = Depends(get_activity_feed_use_case),
    filter: Literal["all", "mine", "watching"] = Query("all"),
    limit: int = Query(16, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> PaginatedActivityFeedResponse:
    """Get activity feed with reviews."""
    items = await use_case.execute(account_uuid, filter, limit + 1, offset)
    has_more = len(items) > limit
    paginated_items = items[:limit]
    return PaginatedActivityFeedResponse(
        items=[
            ActivityFeedItemResponse.from_activity_item(item) for item in paginated_items
        ],
        has_more=has_more,
    )
