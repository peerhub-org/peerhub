from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.application.accounts.use_cases.delete_account import DeleteAccountUseCase
from app.domain.accounts.entities.account import Account
from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.watchlist.services.watchlist_service import WatchlistService


@pytest.mark.asyncio
async def test_delete_account_calls_bulk_deletes(
    account_service: AccountService,
    review_service: ReviewService,
    watchlist_service: WatchlistService,
    mock_account_repository: AsyncMock,
    mock_review_repository: AsyncMock,
    mock_watchlist_repository: AsyncMock,
):
    account_uuid = uuid4()
    account = Account(id="a1", uuid=account_uuid, username="alice", access_token="t")

    mock_account_repository.get_by_uuid.return_value = account
    mock_review_repository.delete_all_by_reviewer_uuid.return_value = 2
    mock_watchlist_repository.delete_all_by_watcher.return_value = 1
    mock_account_repository.update.side_effect = lambda a: a

    use_case = DeleteAccountUseCase(account_service, review_service, watchlist_service)
    result = await use_case.execute(account_uuid)

    assert result.deleted_at is not None
    assert result.access_token == ""
    mock_review_repository.delete_all_by_reviewer_uuid.assert_called_once_with(
        account_uuid
    )
    mock_watchlist_repository.delete_all_by_watcher.assert_called_once_with(account_uuid)


@pytest.mark.asyncio
async def test_delete_account_no_reviews_or_watchings(
    account_service: AccountService,
    review_service: ReviewService,
    watchlist_service: WatchlistService,
    mock_account_repository: AsyncMock,
    mock_review_repository: AsyncMock,
    mock_watchlist_repository: AsyncMock,
):
    account_uuid = uuid4()
    account = Account(id="a1", uuid=account_uuid, username="alice", access_token="t")

    mock_account_repository.get_by_uuid.return_value = account
    mock_review_repository.delete_all_by_reviewer_uuid.return_value = 0
    mock_watchlist_repository.delete_all_by_watcher.return_value = 0
    mock_account_repository.update.side_effect = lambda a: a

    use_case = DeleteAccountUseCase(account_service, review_service, watchlist_service)
    result = await use_case.execute(account_uuid)

    assert result.deleted_at is not None
    mock_review_repository.delete_all_by_reviewer_uuid.assert_called_once()
    mock_watchlist_repository.delete_all_by_watcher.assert_called_once()
