from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.application.reviews.use_cases.create_or_update_review import (
    CreateOrUpdateReviewUseCase,
)
from app.application.reviews.use_cases.delete_review import DeleteReviewUseCase
from app.application.reviews.use_cases.get_reviewers import GetReviewersUseCase
from app.application.reviews.use_cases.get_reviews import GetReviewsUseCase
from app.application.reviews.use_cases.get_suggestions import GetSuggestionsUseCase
from app.application.reviews.use_cases.toggle_comment_hidden import (
    ToggleCommentHiddenUseCase,
)
from app.domain.shared.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.infrastructure.shared.constants import RATE_LIMIT_REVIEW_WRITE
from app.presentation.api.dependencies.auth import get_current_account_uuid
from app.presentation.api.dependencies.reviews import (
    get_create_or_update_review_use_case,
    get_delete_review_use_case,
    get_reviewers_use_case,
    get_reviews_use_case,
    get_suggestions_use_case,
    get_toggle_comment_hidden_use_case,
)
from app.presentation.api.v1.review.schemas.request import (
    CreateOrUpdateReviewRequest,
    ToggleCommentHiddenRequest,
)
from app.presentation.api.v1.review.schemas.response import (
    PaginatedReviewResponse,
    ReviewerSummaryResponse,
    ReviewResponse,
    ReviewSuggestionResponse,
)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("", response_model=ReviewResponse)
@limiter.limit(RATE_LIMIT_REVIEW_WRITE)
async def create_or_update_review(
    request: Request,
    body: CreateOrUpdateReviewRequest,
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: CreateOrUpdateReviewUseCase = Depends(get_create_or_update_review_use_case),
) -> ReviewResponse:
    """Create or update a review for a user."""
    result = await use_case.execute(
        reviewer_uuid=account_uuid,
        reviewed_username=body.reviewed_username,
        status=body.status,
        comment=body.comment,
        anonymous=body.anonymous,
    )
    return ReviewResponse.from_review_with_username(result)


@router.get("/suggestions", response_model=list[ReviewSuggestionResponse])
async def get_suggestions(
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: GetSuggestionsUseCase = Depends(get_suggestions_use_case),
) -> list[ReviewSuggestionResponse]:
    """Get review suggestions to visit based on GitHub following list."""
    suggestions = await use_case.execute(account_uuid)
    return [
        ReviewSuggestionResponse(
            username=item["username"], avatar_url=item.get("avatar_url")
        )
        for item in suggestions
    ]


@router.get("/{username}/reviewers", response_model=list[ReviewerSummaryResponse])
async def get_reviewers(
    username: str,
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: GetReviewersUseCase = Depends(get_reviewers_use_case),
) -> list[ReviewerSummaryResponse]:
    """Get all reviewers for a user (no pagination, for sidebar display)."""
    reviewers_with_usernames = await use_case.execute(username, account_uuid)

    return [
        ReviewerSummaryResponse.from_review_with_username(r)
        for r in reviewers_with_usernames
    ]


@router.get("/{username}", response_model=PaginatedReviewResponse)
async def get_reviews(
    username: str,
    limit: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    offset: int = Query(0, ge=0),
    status: str | None = Query(None),
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: GetReviewsUseCase = Depends(get_reviews_use_case),
) -> PaginatedReviewResponse:
    """Get paginated reviews for a user."""
    result = await use_case.execute(
        username,
        viewer_uuid=account_uuid,
        limit=limit,
        offset=offset,
        status=status,
    )

    items = [
        ReviewResponse.from_review_with_username(r, is_page_owner=result.is_page_owner)
        for r in result.items
    ]

    return PaginatedReviewResponse(
        items=items,
        has_more=result.has_more,
    )


@router.delete("/{username}", status_code=204)
async def delete_review(
    username: str,
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: DeleteReviewUseCase = Depends(get_delete_review_use_case),
) -> None:
    """Delete your review of a user."""
    await use_case.execute(account_uuid, username)


@router.patch("/{review_id}/visibility", response_model=ReviewResponse)
async def toggle_comment_hidden(
    review_id: str,
    request: ToggleCommentHiddenRequest,
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: ToggleCommentHiddenUseCase = Depends(get_toggle_comment_hidden_use_case),
) -> ReviewResponse:
    """Toggle the hidden state of a review comment. Only page owner can do this."""
    result = await use_case.execute(review_id, account_uuid, request.hidden)
    return ReviewResponse.from_review_with_username(result)
