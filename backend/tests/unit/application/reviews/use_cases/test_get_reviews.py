from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.application.reviews.use_cases.get_reviews import GetReviewsUseCase
from app.domain.accounts.entities.account import Account
from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.entities.review import Review, ReviewStatus
from app.domain.reviews.services.review_enrichment_service import ReviewEnrichmentService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.users.entities.user import User


@pytest.mark.asyncio
async def test_get_reviews_resolves_usernames(
    review_service: ReviewService,
    account_service: AccountService,
    enrichment_service: ReviewEnrichmentService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    reviewer_uuid = uuid4()
    viewer_uuid = uuid4()
    now = datetime.now(timezone.utc)
    review = Review(
        id="r1",
        reviewer_uuid=reviewer_uuid,
        reviewed_username="bob",
        status=ReviewStatus.APPROVE,
        comment=None,
        anonymous=False,
        created_at=now,
        updated_at=now,
    )
    account = Account(id="a1", uuid=reviewer_uuid, username="alice", access_token="t")
    viewer_account = Account(
        id="viewer-1", uuid=viewer_uuid, username="viewer", access_token="t"
    )
    user = User(
        username="alice",
        avatar_url="https://example.com/alice.png",
    )

    mock_review_repository.get_all_for_username.return_value = [review]
    mock_account_repository.get_by_uuid.return_value = viewer_account
    mock_account_repository.get_by_uuids.return_value = [account]
    mock_account_repository.get_by_username.return_value = Account(
        id="target-1", uuid=uuid4(), username="bob", access_token="t"
    )
    mock_user_repository.get_by_usernames.return_value = [user]

    use_case = GetReviewsUseCase(review_service, account_service, enrichment_service)
    results = await use_case.execute("bob", viewer_uuid=viewer_uuid)

    assert len(results.items) == 1
    assert results.items[0].reviewer_username == "alice"
    assert results.items[0].reviewer_avatar_url == "https://example.com/alice.png"


@pytest.mark.asyncio
async def test_get_reviews_skips_deleted_accounts(
    review_service: ReviewService,
    account_service: AccountService,
    enrichment_service: ReviewEnrichmentService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    reviewer_uuid = uuid4()
    viewer_uuid = uuid4()
    now = datetime.now(timezone.utc)
    review = Review(
        id="r1",
        reviewer_uuid=reviewer_uuid,
        reviewed_username="bob",
        status=ReviewStatus.APPROVE,
        comment=None,
        anonymous=False,
        created_at=now,
        updated_at=now,
    )
    deleted_account = Account(
        id="a1",
        uuid=reviewer_uuid,
        username="alice",
        access_token="",
        deleted_at=datetime.now(timezone.utc),
    )
    viewer_account = Account(
        id="viewer-1", uuid=viewer_uuid, username="viewer", access_token="t"
    )

    mock_review_repository.get_all_for_username.return_value = [review]
    mock_account_repository.get_by_uuid.return_value = viewer_account
    mock_account_repository.get_by_uuids.return_value = [deleted_account]
    mock_account_repository.get_by_username.return_value = Account(
        id="target-1", uuid=uuid4(), username="bob", access_token="t"
    )
    mock_user_repository.get_by_usernames.return_value = []

    use_case = GetReviewsUseCase(review_service, account_service, enrichment_service)
    results = await use_case.execute("bob", viewer_uuid=viewer_uuid)

    assert len(results.items) == 0


@pytest.mark.asyncio
async def test_get_reviews_draft_only_shows_viewer_reviews(
    review_service: ReviewService,
    account_service: AccountService,
    enrichment_service: ReviewEnrichmentService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    viewer_uuid = uuid4()
    other_uuid = uuid4()
    now = datetime.now(timezone.utc)
    viewer_review = Review(
        id="r1",
        reviewer_uuid=viewer_uuid,
        reviewed_username="draft-user",
        status=ReviewStatus.APPROVE,
        comment=None,
        anonymous=False,
        created_at=now,
        updated_at=now,
    )
    other_review = Review(
        id="r2",
        reviewer_uuid=other_uuid,
        reviewed_username="draft-user",
        status=ReviewStatus.COMMENT,
        comment="Hi",
        anonymous=False,
        created_at=now,
        updated_at=now,
    )

    viewer_account = Account(
        id="viewer-1", uuid=viewer_uuid, username="viewer", access_token="t"
    )

    mock_review_repository.get_all_for_username.return_value = [
        viewer_review,
        other_review,
    ]
    mock_account_repository.get_by_uuid.return_value = viewer_account
    mock_account_repository.get_by_uuids.return_value = [viewer_account]
    mock_account_repository.get_by_username.return_value = None
    mock_user_repository.get_by_usernames.return_value = [
        User(username="viewer", avatar_url=None)
    ]

    use_case = GetReviewsUseCase(review_service, account_service, enrichment_service)
    results = await use_case.execute("draft-user", viewer_uuid=viewer_uuid)

    assert len(results.items) == 1
    assert results.items[0].review.id == "r1"
    assert results.items[0].reviewer_username == "viewer"
