from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.domain.accounts.entities.account import Account
from app.domain.reviews.entities.review import Review, ReviewStatus
from app.domain.reviews.services.review_enrichment_service import ReviewEnrichmentService
from app.domain.users.entities.user import User


@pytest.mark.asyncio
async def test_enrich_reviews_resolves_usernames(
    enrichment_service: ReviewEnrichmentService,
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
        comment=None,
        anonymous=False,
        created_at=now,
        updated_at=now,
    )
    account = Account(id="a1", uuid=reviewer_uuid, username="alice", access_token="t")
    user = User(username="alice", avatar_url="https://example.com/alice.png")

    mock_account_repository.get_by_uuids.return_value = [account]
    mock_user_repository.get_by_usernames.return_value = [user]

    result = await enrichment_service.enrich_reviews([review])

    assert len(result) == 1
    assert result[0].reviewer_username == "alice"
    assert result[0].reviewer_avatar_url == "https://example.com/alice.png"


@pytest.mark.asyncio
async def test_enrich_reviews_filters_deleted_accounts(
    enrichment_service: ReviewEnrichmentService,
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
        deleted_at=now,
    )

    mock_account_repository.get_by_uuids.return_value = [deleted_account]

    result = await enrichment_service.enrich_reviews([review])

    assert result == []


@pytest.mark.asyncio
async def test_enrich_reviews_handles_missing_user(
    enrichment_service: ReviewEnrichmentService,
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
        comment=None,
        anonymous=False,
        created_at=now,
        updated_at=now,
    )
    account = Account(id="a1", uuid=reviewer_uuid, username="alice", access_token="t")

    mock_account_repository.get_by_uuids.return_value = [account]
    mock_user_repository.get_by_usernames.return_value = []

    result = await enrichment_service.enrich_reviews([review])

    assert len(result) == 1
    assert result[0].reviewer_username == "alice"
    assert result[0].reviewer_avatar_url is None


@pytest.mark.asyncio
async def test_enrich_reviews_empty_list(
    enrichment_service: ReviewEnrichmentService,
):
    result = await enrichment_service.enrich_reviews([])
    assert result == []


@pytest.mark.asyncio
async def test_enrich_reviews_skips_unknown_reviewer(
    enrichment_service: ReviewEnrichmentService,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    now = datetime.now(timezone.utc)
    review = Review(
        id="r1",
        reviewer_uuid=uuid4(),
        reviewed_username="bob",
        status=ReviewStatus.APPROVE,
        comment=None,
        anonymous=False,
        created_at=now,
        updated_at=now,
    )

    mock_account_repository.get_by_uuids.return_value = []
    mock_user_repository.get_by_usernames.return_value = []

    result = await enrichment_service.enrich_reviews([review])

    assert result == []
