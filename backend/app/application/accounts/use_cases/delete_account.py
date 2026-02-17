from uuid import UUID

from app.domain.accounts.entities.account import Account
from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.watchlist.services.watchlist_service import WatchlistService


class DeleteAccountUseCase:
    """Use case for deleting an account."""

    def __init__(
        self,
        account_service: AccountService,
        review_service: ReviewService,
        watchlist_service: WatchlistService,
    ):
        self.account_service = account_service
        self.review_service = review_service
        self.watchlist_service = watchlist_service

    async def execute(self, account_uuid: UUID) -> Account:
        """Delete an account by UUID."""
        account = await self.account_service.get_account_by_uuid(account_uuid)
        await self.review_service.delete_reviews_by_reviewer(account_uuid)
        await self.watchlist_service.delete_all_by_watcher(account_uuid)
        return await self.account_service.delete_account(account)
