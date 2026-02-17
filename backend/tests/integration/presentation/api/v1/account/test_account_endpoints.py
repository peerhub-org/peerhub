from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import UUID

import pytest
from httpx import ASGITransport, AsyncClient

from app.application.accounts.use_cases.get_activity_feed import ActivityFeedItem
from app.domain.accounts.entities.account import Account
from app.domain.reviews.entities.review import Review, ReviewStatus
from app.main import app
from app.presentation.api.dependencies import (
    get_activity_feed_use_case,
    get_current_account_use_case,
    get_delete_account_use_case,
)


@pytest.mark.asyncio
async def test_get_current_account(async_client: AsyncClient, auth_uuid: UUID):
    account = Account(
        id="a1",
        uuid=auth_uuid,
        username="testuser",
        access_token="t",
        created_at=datetime.now(timezone.utc),
    )
    mock_use_case = AsyncMock()
    mock_use_case.execute.return_value = account
    app.dependency_overrides[get_current_account_use_case] = lambda: mock_use_case

    response = await async_client.get("/api/v1/account")

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["uuid"] == str(auth_uuid)


@pytest.mark.asyncio
async def test_get_current_account_unauthenticated():
    app.dependency_overrides.clear()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/account")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delete_account(async_client: AsyncClient, auth_uuid: UUID):
    deleted_account = Account(
        id="a1",
        uuid=auth_uuid,
        username="testuser",
        access_token="",
        created_at=datetime.now(timezone.utc),
        deleted_at=datetime.now(timezone.utc),
    )
    mock_use_case = AsyncMock()
    mock_use_case.execute.return_value = deleted_account
    app.dependency_overrides[get_delete_account_use_case] = lambda: mock_use_case

    response = await async_client.delete("/api/v1/account")

    assert response.status_code == 200
    data = response.json()
    assert data["deleted_at"] is not None


@pytest.mark.asyncio
async def test_get_activity_feed(async_client: AsyncClient, auth_uuid: UUID):
    now = datetime.now(timezone.utc)
    review = Review(
        id="r1",
        reviewer_uuid=auth_uuid,
        reviewed_username="alice",
        status=ReviewStatus.APPROVE,
        comment="Great work",
        anonymous=False,
        comment_hidden=False,
        created_at=now,
        updated_at=now,
    )
    item = ActivityFeedItem(
        review=review,
        reviewer_username="testuser",
        reviewer_avatar_url="https://example.com/testuser.png",
        reviewed_user_avatar_url="https://example.com/alice.png",
    )
    mock_use_case = AsyncMock()
    mock_use_case.execute.return_value = [item]
    app.dependency_overrides[get_activity_feed_use_case] = lambda: mock_use_case

    response = await async_client.get("/api/v1/account/feed")

    assert response.status_code == 200
    data = response.json()
    assert data["has_more"] is False
    assert len(data["items"]) == 1
    assert data["items"][0]["review_id"] == "r1"
