from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.presentation.api.dependencies import get_current_account_uuid


@pytest.fixture
def auth_uuid() -> UUID:
    return uuid4()


@pytest_asyncio.fixture
async def async_client(auth_uuid: UUID):
    app.dependency_overrides[get_current_account_uuid] = lambda: auth_uuid
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()
