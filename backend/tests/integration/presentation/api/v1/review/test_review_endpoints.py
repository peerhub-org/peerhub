from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient

from app.application.reviews.use_cases.get_reviews import (
    PaginatedReviewsResult,
    ReviewWithUsername,
)
from app.domain.reviews.entities.review import Review, ReviewStatus
from app.domain.shared.exceptions import SelfReviewException
from app.main import app
from app.presentation.api.dependencies import (
    get_create_or_update_review_use_case,
    get_delete_review_use_case,
    get_reviewers_use_case,
    get_reviews_use_case,
)


@pytest.mark.asyncio
async def test_create_review(async_client: AsyncClient, auth_uuid: UUID):
    now = datetime.now(timezone.utc)
    review = Review(
        id="r1",
        reviewer_uuid=auth_uuid,
        reviewed_username="bob",
        status=ReviewStatus.APPROVE,
        comment="Great!",
        anonymous=False,
        created_at=now,
        updated_at=now,
    )
    review_with_username = ReviewWithUsername(
        review=review,
        reviewer_username="alice",
        reviewer_avatar_url=None,
    )
    mock_use_case = AsyncMock()
    mock_use_case.execute.return_value = review_with_username

    app.dependency_overrides[get_create_or_update_review_use_case] = lambda: mock_use_case

    response = await async_client.post(
        "/api/v1/reviews",
        json={
            "reviewed_username": "bob",
            "status": "approve",
            "comment": "Great!",
            "anonymous": False,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["reviewed_username"] == "bob"
    assert data["status"] == "approve"
    assert data["reviewer_username"] == "alice"


@pytest.mark.asyncio
async def test_get_reviews(async_client: AsyncClient, auth_uuid: UUID):
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
    review_with_username = ReviewWithUsername(
        review=review,
        reviewer_username="alice",
        reviewer_avatar_url=None,
    )
    mock_use_case = AsyncMock()
    mock_use_case.execute.return_value = PaginatedReviewsResult(
        items=[review_with_username],
        has_more=False,
        is_page_owner=False,
    )

    app.dependency_overrides[get_reviews_use_case] = lambda: mock_use_case

    response = await async_client.get("/api/v1/reviews/bob")

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["reviewer_username"] == "alice"
    assert data["has_more"] is False
    mock_use_case.execute.assert_called_once_with(
        "bob", viewer_uuid=auth_uuid, limit=16, offset=0, status=None
    )


@pytest.mark.asyncio
async def test_delete_review(async_client: AsyncClient, auth_uuid: UUID):
    mock_use_case = AsyncMock()
    mock_use_case.execute.return_value = None
    app.dependency_overrides[get_delete_review_use_case] = lambda: mock_use_case

    response = await async_client.delete("/api/v1/reviews/bob")

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_create_review_self_review(async_client: AsyncClient, auth_uuid: UUID):
    mock_use_case = AsyncMock()
    mock_use_case.execute.side_effect = SelfReviewException("alice")

    app.dependency_overrides[get_create_or_update_review_use_case] = lambda: mock_use_case

    response = await async_client.post(
        "/api/v1/reviews",
        json={
            "reviewed_username": "alice",
            "status": "approve",
            "comment": None,
            "anonymous": False,
        },
    )

    assert response.status_code == 400
    assert "Cannot review yourself" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_reviewers(async_client: AsyncClient, auth_uuid: UUID):
    now = datetime.now(timezone.utc)
    review1 = Review(
        id="r1",
        reviewer_uuid=uuid4(),
        reviewed_username="bob",
        status=ReviewStatus.APPROVE,
        comment=None,
        anonymous=False,
        created_at=now,
        updated_at=now,
    )
    review2 = Review(
        id="r2",
        reviewer_uuid=uuid4(),
        reviewed_username="bob",
        status=ReviewStatus.COMMENT,
        comment="Nice",
        anonymous=True,
        created_at=now,
        updated_at=now,
    )
    reviewers = [
        ReviewWithUsername(
            review=review1,
            reviewer_username="alice",
            reviewer_avatar_url="https://example.com/a.png",
        ),
        ReviewWithUsername(
            review=review2, reviewer_username="charlie", reviewer_avatar_url=None
        ),
    ]

    mock_use_case = AsyncMock()
    mock_use_case.execute.return_value = reviewers

    app.dependency_overrides[get_reviewers_use_case] = lambda: mock_use_case

    response = await async_client.get("/api/v1/reviews/bob/reviewers")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["reviewer_username"] == "alice"
    assert data[0]["reviewer_avatar_url"] == "https://example.com/a.png"
    assert data[0]["status"] == "approve"
    # Anonymous review hides identity
    assert data[1]["reviewer_username"] is None
    assert data[1]["reviewer_avatar_url"] is None
    assert data[1]["anonymous"] is True
    # No comment or comment_hidden fields in reviewer summary
    assert "comment" not in data[0]
    assert "comment_hidden" not in data[0]
