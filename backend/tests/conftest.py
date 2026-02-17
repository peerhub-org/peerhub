from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.domain.accounts.entities.account import Account
from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.entities.review import Review, ReviewStatus
from app.domain.reviews.services.review_enrichment_service import ReviewEnrichmentService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.users.entities.user import User
from app.domain.users.services.user_service import UserService
from app.domain.watchlist.entities.watch import Watch
from app.domain.watchlist.services.watchlist_service import WatchlistService


@pytest.fixture
def mock_account_repository() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
def mock_review_repository() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
def mock_watchlist_repository() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
def mock_user_repository() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
def account_service(mock_account_repository: AsyncMock) -> AccountService:
    return AccountService(mock_account_repository)


@pytest.fixture
def review_service(
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
) -> ReviewService:
    return ReviewService(
        mock_review_repository, mock_account_repository, mock_user_repository
    )


@pytest.fixture
def watchlist_service(
    mock_watchlist_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
) -> WatchlistService:
    return WatchlistService(
        mock_watchlist_repository, mock_account_repository, mock_user_repository
    )


@pytest.fixture
def sample_account() -> Account:
    return Account(
        id="test-id",
        uuid=uuid4(),
        username="testuser",
        access_token="test-token",
        created_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def sample_review() -> Review:
    now = datetime.now(timezone.utc)
    return Review(
        id="review-id",
        reviewer_uuid=uuid4(),
        reviewed_username="revieweduser",
        status=ReviewStatus.APPROVE,
        comment="Great work!",
        anonymous=False,
        created_at=now,
        updated_at=now,
    )


@pytest.fixture
def sample_watch() -> Watch:
    return Watch(
        id="sub-id",
        watcher_uuid=uuid4(),
        watched_username="followeduser",
        created_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def user_service(mock_user_repository: AsyncMock) -> UserService:
    return UserService(mock_user_repository)


@pytest.fixture
def enrichment_service(
    account_service: AccountService, user_service: UserService
) -> ReviewEnrichmentService:
    return ReviewEnrichmentService(account_service, user_service)


@pytest.fixture
def sample_user() -> User:
    return User(
        username="testuser",
        id="u1",
        name="Test User",
        bio="Hello",
        avatar_url="https://example.com/avatar.png",
        type="User",
        updated_at=datetime.now(timezone.utc),
    )
