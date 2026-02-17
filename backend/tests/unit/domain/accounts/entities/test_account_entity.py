from datetime import datetime, timezone
from uuid import uuid4

from app.domain.accounts.entities.account import Account


def test_account_delete():
    """Test that account deactivation works correctly."""
    account = Account(
        id="123",
        uuid=uuid4(),
        username="testuser",
        access_token="token",
    )

    account.delete()
    assert account.deleted_at is not None
    assert account.access_token == ""


def test_account_activate():
    """Test that account activation works correctly."""
    account = Account(
        id="123",
        uuid=uuid4(),
        username="testuser",
        access_token="token",
        deleted_at=datetime.now(timezone.utc),
    )

    account.activate()
    assert account.deleted_at is None
