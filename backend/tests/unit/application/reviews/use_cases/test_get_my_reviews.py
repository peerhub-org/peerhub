from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.application.reviews.use_cases.get_my_reviews import GetMyReviewsUseCase
from app.domain.accounts.entities.account import Account
from app.domain.reviews.entities.review import Review, ReviewStatus
from app.domain.reviews.services.review_enrichment_service import ReviewEnrichmentService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.users.entities.user import User


@pytest.mark.asyncio
async def test_get_my_reviews_happy_path(
    review_service: ReviewService,
    enrichment_service: ReviewEnrichmentService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    reviewer_uuid = uuid4()
    now = datetime.now(timezone.utc)
    review = Review(
        id="r1",
        reviewer_uuid=reviewer_uuid,
        reviewed_username="bob",
        status=ReviewStatus.APPROVE,
        comment="Nice work!",
        anonymous=False,
        created_at=now,
        updated_at=now,
    )
    account = Account(id="a1", uuid=reviewer_uuid, username="alice", access_token="t")
    user = User(username="alice", avatar_url="https://example.com/alice.png")

    mock_review_repository.get_all_by_reviewer_uuid.return_value = [review]
    mock_account_repository.get_by_uuids.return_value = [account]
    mock_user_repository.get_by_usernames.return_value = [user]

    use_case = GetMyReviewsUseCase(review_service, enrichment_service)
    results = await use_case.execute(reviewer_uuid, limit=100, offset=0)

    assert len(results) == 1
    assert results[0].review == review
    assert results[0].reviewer_username == "alice"


@pytest.mark.asyncio
async def test_get_my_reviews_no_reviews(
    review_service: ReviewService,
    enrichment_service: ReviewEnrichmentService,
    mock_review_repository: AsyncMock,
):
    reviewer_uuid = uuid4()
    mock_review_repository.get_all_by_reviewer_uuid.return_value = []

    use_case = GetMyReviewsUseCase(review_service, enrichment_service)
    results = await use_case.execute(reviewer_uuid, limit=100, offset=0)

    assert results == []
