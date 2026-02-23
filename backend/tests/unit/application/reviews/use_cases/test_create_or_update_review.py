from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.application.reviews.use_cases.create_or_update_review import (
    CreateOrUpdateReviewUseCase,
)
from app.domain.accounts.entities.account import Account
from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.entities.review import Review, ReviewStatus
from app.domain.reviews.services.review_enrichment_service import ReviewEnrichmentService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.users.entities.user import User
from app.domain.watchlist.services.watchlist_service import WatchlistService
from app.infrastructure.email.email_service import EmailService


@pytest.mark.asyncio
async def test_create_or_update_review_happy_path(
    review_service: ReviewService,
    account_service: AccountService,
    enrichment_service: ReviewEnrichmentService,
    watchlist_service: WatchlistService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
    mock_watchlist_repository: AsyncMock,
):
    reviewer_uuid = uuid4()
    now = datetime.now(timezone.utc)
    review = Review(
        id="r1",
        reviewer_uuid=reviewer_uuid,
        reviewed_username="bob",
        status=ReviewStatus.APPROVE,
        comment="Looks good!",
        anonymous=False,
        created_at=now,
        updated_at=now,
    )
    account = Account(id="a1", uuid=reviewer_uuid, username="alice", access_token="t")
    user = User(username="alice", avatar_url="https://example.com/alice.png")

    # Validator: check_not_self_action calls get_by_uuid
    mock_account_repository.get_by_uuid.return_value = account
    # Validator: check_target_is_user_type calls get_by_username on user_repo
    mock_user_repository.get_by_username.return_value = User(username="bob", type="User")
    # No existing review (new creation) — service now returns (review, is_new)
    mock_review_repository.get_by_reviewer_and_username.return_value = None
    mock_review_repository.create.return_value = review
    # Enrichment: get_accounts_by_uuids -> get_by_uuids
    mock_account_repository.get_by_uuids.return_value = [account]
    # Enrichment: get_users_by_usernames -> get_by_usernames
    mock_user_repository.get_by_usernames.return_value = [user]

    # Watchlist: auto-watch after review
    mock_watchlist_repository.get_by_watcher_and_username.return_value = None
    mock_watchlist_repository.create.return_value = AsyncMock()

    mock_email_service = MagicMock(spec=EmailService)
    mock_email_service._configured = False

    use_case = CreateOrUpdateReviewUseCase(
        review_service, account_service, enrichment_service, watchlist_service,
        mock_email_service,
    )
    result = await use_case.execute(
        reviewer_uuid=reviewer_uuid,
        reviewed_username="bob",
        status=ReviewStatus.APPROVE,
        comment="Looks good!",
        anonymous=False,
    )

    assert result.review.reviewer_uuid == reviewer_uuid
    assert result.review.reviewed_username == "bob"
    assert result.reviewer_username == "alice"
    assert result.reviewer_avatar_url == "https://example.com/alice.png"


@pytest.mark.asyncio
async def test_create_or_update_review_auto_watches_user(
    review_service: ReviewService,
    account_service: AccountService,
    enrichment_service: ReviewEnrichmentService,
    watchlist_service: WatchlistService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
    mock_watchlist_repository: AsyncMock,
):
    reviewer_uuid = uuid4()
    now = datetime.now(timezone.utc)
    review = Review(
        id="r1",
        reviewer_uuid=reviewer_uuid,
        reviewed_username="bob",
        status=ReviewStatus.APPROVE,
        comment="Great!",
        anonymous=False,
        created_at=now,
        updated_at=now,
    )
    account = Account(id="a1", uuid=reviewer_uuid, username="alice", access_token="t")
    user = User(username="alice", avatar_url="https://example.com/alice.png")

    mock_account_repository.get_by_uuid.return_value = account
    mock_user_repository.get_by_username.return_value = User(username="bob", type="User")
    mock_review_repository.get_by_reviewer_and_username.return_value = None
    mock_review_repository.create.return_value = review
    mock_account_repository.get_by_uuids.return_value = [account]
    mock_user_repository.get_by_usernames.return_value = [user]
    mock_watchlist_repository.get_by_watcher_and_username.return_value = None
    mock_watchlist_repository.create.return_value = AsyncMock()

    mock_email_service = MagicMock(spec=EmailService)
    mock_email_service._configured = False

    use_case = CreateOrUpdateReviewUseCase(
        review_service, account_service, enrichment_service, watchlist_service,
        mock_email_service,
    )
    await use_case.execute(
        reviewer_uuid=reviewer_uuid,
        reviewed_username="bob",
        status=ReviewStatus.APPROVE,
        comment="Great!",
        anonymous=False,
    )

    mock_watchlist_repository.create.assert_called_once()
