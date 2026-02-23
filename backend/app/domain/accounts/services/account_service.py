from uuid import UUID, uuid4

from app.domain.accounts.entities.account import Account
from app.domain.accounts.repositories.account_repository import IAccountRepository
from app.domain.shared.exceptions import AccountNotFoundException


class AccountService:
    """Domain service for account business logic."""

    def __init__(self, account_repository: IAccountRepository):
        self.account_repository = account_repository

    async def get_account_by_uuid(self, uuid: UUID) -> Account:
        """Get an account by UUID, raise exception if not found."""
        account = await self.account_repository.get_by_uuid(uuid)
        if account is None:
            raise AccountNotFoundException(str(uuid))
        return account

    async def get_active_account_by_uuid(self, uuid: UUID) -> Account:
        """Get an active account by UUID, raise exception if not found or inactive."""
        account = await self.get_account_by_uuid(uuid)
        if account.deleted_at is not None:
            raise AccountNotFoundException(str(uuid))
        return account

    async def get_account_by_username(self, username: str) -> Account | None:
        """Get an account by username."""
        return await self.account_repository.get_by_username(username)

    async def get_accounts_by_uuids(self, uuids: list[UUID]) -> dict[UUID, Account]:
        """Get accounts by UUIDs, returned as a dict keyed by UUID."""
        accounts = await self.account_repository.get_by_uuids(uuids)
        return {a.uuid: a for a in accounts}

    async def get_accounts_by_usernames(self, usernames: list[str]) -> dict[str, Account]:
        """Get accounts by usernames, returned as a dict keyed by lowercase username."""
        accounts = await self.account_repository.get_by_usernames(usernames)
        return {a.username.lower(): a for a in accounts}

    async def create_account(self, account: Account) -> Account:
        """Create a new account."""
        return await self.account_repository.create(account)

    async def update_account(self, account: Account) -> Account:
        """Update an existing account."""
        return await self.account_repository.update(account)

    async def delete_account(self, account: Account) -> Account:
        """Delete an account."""
        account.delete()
        return await self.account_repository.update(account)

    async def get_or_create_account(
        self,
        username: str,
        access_token: str,
        email: str | None = None,
    ) -> tuple[Account, bool]:
        """Get existing account by username or create a new one.

        Returns a tuple of (account, is_new) where is_new indicates
        whether a new account was created.
        """
        existing_account = await self.get_account_by_username(username)
        if existing_account:
            needs_update = False

            if existing_account.deleted_at:
                existing_account.activate()
                needs_update = True

            if access_token:
                existing_account.access_token = access_token
                needs_update = True

            if email and existing_account.email != email:
                existing_account.email = email
                needs_update = True

            if needs_update:
                return await self.update_account(existing_account), False
            return existing_account, False

        new_account = Account(
            id=None,
            uuid=uuid4(),
            username=username,
            access_token=access_token,
            email=email,
        )
        return await self.create_account(new_account), True
