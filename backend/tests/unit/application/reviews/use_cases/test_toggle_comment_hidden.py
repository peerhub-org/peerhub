from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.application.reviews.use_cases.toggle_comment_hidden import (
    ToggleCommentHiddenUseCase,
)
from app.domain.accounts.entities.account import Account
from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.entities.review import Review, ReviewStatus
from app.domain.reviews.services.review_enrichment_service import ReviewEnrichmentService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.shared.exceptions import (
    ReviewNotFoundException,
    UnauthorizedActionException,
)


@pytest.mark.asyncio
async def test_toggle_hidden_success(
    review_service: ReviewService,
    account_service: AccountService,
    enrichment_service: ReviewEnrichmentService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    owner_uuid = uuid4()
    reviewer_uuid = uuid4()
    now = datetime.now(timezone.utc)
    review = Review(
        id="r1",
        reviewer_uuid=reviewer_uuid,
        reviewed_username="alice",
        status=ReviewStatus.COMMENT,
        comment="Hello",
        anonymous=False,
        created_at=now,
        updated_at=now,
        comment_hidden=False,
    )
    owner_account = Account(id="a1", uuid=owner_uuid, username="alice", access_token="t")
    reviewer_account = Account(
        id="a2", uuid=reviewer_uuid, username="bob", access_token="t"
    )

    mock_review_repository.get_by_id.return_value = review
    mock_account_repository.get_by_uuid.return_value = owner_account
    mock_review_repository.update.side_effect = lambda r: r
    mock_account_repository.get_by_uuids.return_value = [reviewer_account]
    mock_user_repository.get_by_usernames.return_value = []

    use_case = ToggleCommentHiddenUseCase(
        review_service, account_service, enrichment_service
    )
    result = await use_case.execute("r1", owner_uuid, True)

    assert result.review.comment_hidden is True
    assert result.reviewer_username == "bob"
    mock_review_repository.update.assert_called_once()


@pytest.mark.asyncio
async def test_toggle_hidden_review_not_found(
    review_service: ReviewService,
    account_service: AccountService,
    enrichment_service: ReviewEnrichmentService,
    mock_review_repository: AsyncMock,
):
    mock_review_repository.get_by_id.return_value = None

    use_case = ToggleCommentHiddenUseCase(
        review_service, account_service, enrichment_service
    )

    with pytest.raises(ReviewNotFoundException):
        await use_case.execute("nonexistent", uuid4(), True)


@pytest.mark.asyncio
async def test_toggle_hidden_not_page_owner(
    review_service: ReviewService,
    account_service: AccountService,
    enrichment_service: ReviewEnrichmentService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
):
    non_owner_uuid = uuid4()
    now = datetime.now(timezone.utc)
    review = Review(
        id="r1",
        reviewer_uuid=uuid4(),
        reviewed_username="alice",
        status=ReviewStatus.COMMENT,
        comment="Hello",
        anonymous=False,
        created_at=now,
        updated_at=now,
    )
    non_owner_account = Account(
        id="a2", uuid=non_owner_uuid, username="bob", access_token="t"
    )

    mock_review_repository.get_by_id.return_value = review
    mock_account_repository.get_by_uuid.return_value = non_owner_account

    use_case = ToggleCommentHiddenUseCase(
        review_service, account_service, enrichment_service
    )

    with pytest.raises(UnauthorizedActionException):
        await use_case.execute("r1", non_owner_uuid, True)
