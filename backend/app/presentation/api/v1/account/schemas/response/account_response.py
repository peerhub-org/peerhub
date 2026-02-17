from datetime import datetime
from uuid import UUID

from app.domain.accounts.entities.account import Account
from app.presentation.api.v1.shared.schemas.response.base_response import BaseResponse


class AccountResponse(BaseResponse):
    """Response schema for account data."""

    id: str
    uuid: UUID
    username: str
    deleted_at: datetime | None = None

    @classmethod
    def from_entity(cls, account: Account) -> "AccountResponse":
        """Create AccountResponse from Account entity."""
        if account.id is None:
            raise ValueError("Account entity must have an id")
        return cls(
            id=account.id,
            uuid=account.uuid,
            username=account.username,
            deleted_at=account.deleted_at,
        )
