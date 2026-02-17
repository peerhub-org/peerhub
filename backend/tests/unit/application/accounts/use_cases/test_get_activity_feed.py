from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.application.accounts.use_cases.get_activity_feed import (
    GetActivityFeedUseCase,
)
from app.domain.accounts.entities.account import Account
from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.entities.review import Review, ReviewStatus
from app.domain.reviews.services.review_service import ReviewService
from app.domain.users.entities.user import User
from app.domain.users.services.user_service import UserService
from app.domain.watchlist.services.watchlist_service import WatchlistService


@pytest.mark.asyncio
async def test_get_activity_feed_mine_filter(
    watchlist_service: WatchlistService,
    review_service: ReviewService,
    account_service: AccountService,
    user_service: UserService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    account_uuid = uuid4()
    reviewer_uuid = uuid4()
    now = datetime.now(timezone.utc)

    account = Account(id="a1", uuid=account_uuid, username="bob", access_token="t")
    reviewer_account = Account(
        id="a2", uuid=reviewer_uuid, username="alice", access_token="t"
    )
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
    alice_user = User(username="alice", avatar_url="https://example.com/alice.png")
    bob_user = User(username="bob", avatar_url="https://example.com/bob.png")

    mock_account_repository.get_by_uuid.return_value = account
    mock_review_repository.get_all_for_username.return_value = [review]
    mock_account_repository.get_by_usernames.return_value = [account]
    mock_account_repository.get_by_uuids.return_value = [reviewer_account]
    mock_user_repository.get_by_usernames.return_value = [alice_user, bob_user]

    use_case = GetActivityFeedUseCase(
        watchlist_service, review_service, account_service, user_service
    )
    results = await use_case.execute(
        account_uuid=account_uuid, filter_type="mine", limit=50, offset=0
    )

    assert len(results) == 1
    assert results[0].review == review
    assert results[0].reviewer_username == "alice"
    assert results[0].reviewed_user_avatar_url == "https://example.com/bob.png"


@pytest.mark.asyncio
async def test_get_activity_feed_skips_deleted_reviewer(
    watchlist_service: WatchlistService,
    review_service: ReviewService,
    account_service: AccountService,
    user_service: UserService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    account_uuid = uuid4()
    deleted_reviewer_uuid = uuid4()
    now = datetime.now(timezone.utc)

    account = Account(id="a1", uuid=account_uuid, username="bob", access_token="t")
    deleted_reviewer_account = Account(
        id="a2",
        uuid=deleted_reviewer_uuid,
        username="deleted-user",
        access_token="",
        deleted_at=now,
    )
    review = Review(
        id="r1",
        reviewer_uuid=deleted_reviewer_uuid,
        reviewed_username="bob",
        status=ReviewStatus.APPROVE,
        comment="Old review",
        anonymous=False,
        created_at=now,
        updated_at=now,
    )

    mock_account_repository.get_by_uuid.return_value = account
    mock_review_repository.get_all_for_username.return_value = [review]
    mock_account_repository.get_by_usernames.return_value = [account]
    mock_account_repository.get_by_uuids.return_value = [deleted_reviewer_account]
    mock_user_repository.get_by_usernames.return_value = []

    use_case = GetActivityFeedUseCase(
        watchlist_service, review_service, account_service, user_service
    )
    results = await use_case.execute(
        account_uuid=account_uuid, filter_type="mine", limit=50, offset=0
    )

    assert len(results) == 0
