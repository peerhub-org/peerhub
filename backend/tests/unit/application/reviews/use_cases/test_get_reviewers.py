from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.application.reviews.use_cases.get_reviewers import GetReviewersUseCase
from app.domain.accounts.entities.account import Account
from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.entities.review import Review, ReviewStatus
from app.domain.reviews.services.review_enrichment_service import ReviewEnrichmentService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.users.entities.user import User
from app.domain.users.services.user_service import UserService


@pytest.mark.asyncio
async def test_get_reviewers_resolves_usernames(
    review_service: ReviewService,
    account_service: AccountService,
    user_service: UserService,
    enrichment_service: ReviewEnrichmentService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    uuid1 = uuid4()
    uuid2 = uuid4()
    now = datetime.now(timezone.utc)
    reviews = [
        Review(
            id="r1",
            reviewer_uuid=uuid1,
            reviewed_username="bob",
            status=ReviewStatus.APPROVE,
            comment=None,
            anonymous=False,
            created_at=now,
            updated_at=now,
        ),
        Review(
            id="r2",
            reviewer_uuid=uuid2,
            reviewed_username="bob",
            status=ReviewStatus.COMMENT,
            comment="Nice",
            anonymous=False,
            created_at=now,
            updated_at=now,
        ),
    ]
    account1 = Account(id="a1", uuid=uuid1, username="alice", access_token="t")
    account2 = Account(id="a2", uuid=uuid2, username="charlie", access_token="t")

    mock_review_repository.get_all_for_username.return_value = reviews
    mock_account_repository.get_by_uuids.return_value = [account1, account2]
    mock_account_repository.get_by_username.return_value = Account(
        id="target-1", uuid=uuid4(), username="bob", access_token="t"
    )
    mock_user_repository.get_by_username.return_value = User(
        username="bob", avatar_url=None
    )
    mock_user_repository.get_by_usernames.return_value = [
        User(username="alice", avatar_url="https://example.com/alice.png"),
        User(username="charlie", avatar_url=None),
    ]

    use_case = GetReviewersUseCase(
        review_service, account_service, user_service, enrichment_service
    )
    results = await use_case.execute("bob", viewer_uuid=uuid4())

    assert len(results) == 2
    assert results[0].reviewer_username == "alice"
    assert results[0].reviewer_avatar_url == "https://example.com/alice.png"
    assert results[1].reviewer_username == "charlie"
    assert results[1].reviewer_avatar_url is None
    mock_review_repository.get_all_for_username.assert_called_once_with(
        "bob", 512, 0, status=None
    )


@pytest.mark.asyncio
async def test_get_reviewers_skips_deleted_accounts(
    review_service: ReviewService,
    account_service: AccountService,
    user_service: UserService,
    enrichment_service: ReviewEnrichmentService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    uuid1 = uuid4()
    uuid2 = uuid4()
    now = datetime.now(timezone.utc)
    reviews = [
        Review(
            id="r1",
            reviewer_uuid=uuid1,
            reviewed_username="bob",
            status=ReviewStatus.APPROVE,
            comment=None,
            anonymous=False,
            created_at=now,
            updated_at=now,
        ),
        Review(
            id="r2",
            reviewer_uuid=uuid2,
            reviewed_username="bob",
            status=ReviewStatus.COMMENT,
            comment="Hi",
            anonymous=False,
            created_at=now,
            updated_at=now,
        ),
    ]

    mock_review_repository.get_all_for_username.return_value = reviews
    mock_account_repository.get_by_uuids.return_value = [
        Account(id="a1", uuid=uuid1, username="alice", access_token="t"),
        Account(
            id="a2",
            uuid=uuid2,
            username="deleted-user",
            access_token="",
            deleted_at=now,
        ),
    ]
    mock_account_repository.get_by_username.return_value = Account(
        id="target-1", uuid=uuid4(), username="bob", access_token="t"
    )
    mock_user_repository.get_by_username.return_value = User(
        username="bob", avatar_url=None
    )
    mock_user_repository.get_by_usernames.return_value = [
        User(username="alice", avatar_url=None),
    ]

    use_case = GetReviewersUseCase(
        review_service, account_service, user_service, enrichment_service
    )
    results = await use_case.execute("bob", viewer_uuid=uuid4())

    assert len(results) == 1
    assert results[0].reviewer_username == "alice"


@pytest.mark.asyncio
async def test_get_reviewers_returns_empty_for_closed_account(
    review_service: ReviewService,
    account_service: AccountService,
    user_service: UserService,
    enrichment_service: ReviewEnrichmentService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    mock_account_repository.get_by_username.return_value = Account(
        id="target-1", uuid=uuid4(), username="bob", access_token="t"
    )
    mock_user_repository.get_by_username.return_value = None

    use_case = GetReviewersUseCase(
        review_service, account_service, user_service, enrichment_service
    )
    results = await use_case.execute("bob", viewer_uuid=uuid4())

    assert results == []
    mock_review_repository.get_all_for_username.assert_not_called()
