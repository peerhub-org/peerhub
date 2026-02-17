from app.domain.accounts.entities.account import Account
from app.infrastructure.accounts.database.models.account_model import AccountDocument
from app.infrastructure.shared.database.mappers.base_mapper import (
    document_id_to_str,
    str_to_document_id,
)


class AccountMapper:
    """Mapper to convert between Account entity and AccountDocument model."""

    @staticmethod
    def to_entity(document: AccountDocument) -> Account:
        """Convert AccountDocument (MongoDB) to Account entity (domain)."""
        return Account(
            id=document_id_to_str(document),
            uuid=document.uuid,
            username=document.username,
            access_token=document.access_token,
            deleted_at=document.deleted_at,
            created_at=document.created_at,
        )

    @staticmethod
    def to_document(entity: Account) -> AccountDocument:
        """Convert Account entity (domain) to AccountDocument (MongoDB)."""
        from datetime import datetime, timezone

        doc = AccountDocument(
            uuid=entity.uuid,
            username=entity.username,
            access_token=entity.access_token,
            deleted_at=entity.deleted_at,
            created_at=entity.created_at or datetime.now(timezone.utc),
        )
        # If entity has an id, set it on the document
        if entity.id:
            doc.id = str_to_document_id(entity.id)
        return doc

    @staticmethod
    def update_document_from_entity(
        document: AccountDocument, entity: Account
    ) -> AccountDocument:
        """Update an AccountDocument with values from an Account entity."""
        document.uuid = entity.uuid
        document.username = entity.username
        document.access_token = entity.access_token
        document.deleted_at = entity.deleted_at
        return document
