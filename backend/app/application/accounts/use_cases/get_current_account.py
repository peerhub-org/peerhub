from uuid import UUID

from app.domain.accounts.entities.account import Account
from app.domain.accounts.services.account_service import AccountService


class GetCurrentAccountUseCase:
    """Use case for retrieving the current authenticated account."""

    def __init__(self, account_service: AccountService):
        self.account_service = account_service

    async def execute(self, account_uuid: UUID) -> Account:
        """Get the current active account by UUID."""
        return await self.account_service.get_active_account_by_uuid(account_uuid)
