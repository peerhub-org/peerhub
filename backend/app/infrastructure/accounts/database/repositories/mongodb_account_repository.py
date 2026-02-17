from uuid import UUID

from app.domain.accounts.entities.account import Account
from app.infrastructure.accounts.database.mappers.account_mapper import AccountMapper
from app.infrastructure.accounts.database.models.account_model import AccountDocument
from app.infrastructure.shared.database.constants import CASE_INSENSITIVE
from app.infrastructure.shared.database.repositories.base_repository import BaseRepository


class MongoDBAccountRepository(BaseRepository[Account, AccountDocument]):
    """MongoDB implementation of IAccountRepository interface."""

    document_class = AccountDocument
    mapper = AccountMapper

    async def get_by_username(self, username: str) -> Account | None:
        """Find an account by username (case-insensitive)."""
        document = await AccountDocument.find_one(
            {"username": username}, collation=CASE_INSENSITIVE
        )
        if document is None:
            return None
        return AccountMapper.to_entity(document)

    async def get_by_uuid(self, uuid: UUID) -> Account | None:
        """Find an account by UUID."""
        document = await AccountDocument.find_one({"uuid": uuid})
        if document is None:
            return None
        return AccountMapper.to_entity(document)

    async def get_by_uuids(self, uuids: list[UUID]) -> list[Account]:
        """Find accounts by a list of UUIDs."""
        documents = await AccountDocument.find({"uuid": {"$in": uuids}}).to_list()
        return [AccountMapper.to_entity(doc) for doc in documents]

    async def get_by_usernames(self, usernames: list[str]) -> list[Account]:
        """Find accounts by a list of usernames (case-insensitive)."""
        documents = await AccountDocument.find(
            {"username": {"$in": usernames}}, collation=CASE_INSENSITIVE
        ).to_list()
        return [AccountMapper.to_entity(doc) for doc in documents]
