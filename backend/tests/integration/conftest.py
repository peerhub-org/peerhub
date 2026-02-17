from __future__ import annotations

import pytest
import pytest_asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from testcontainers.mongodb import MongoDbContainer

from app.infrastructure.shared.config.config import settings
from app.infrastructure.shared.database.connection import init_database


@pytest.fixture(scope="session")
def mongodb_container() -> MongoDbContainer:
    try:
        with MongoDbContainer("mongo:7.0") as mongo:
            yield mongo
    except Exception as exc:  # pragma: no cover - environment dependent
        pytest.skip(f"MongoDB container not available: {exc}")


@pytest_asyncio.fixture(scope="function")
async def mongo_client(mongodb_container: MongoDbContainer) -> AsyncIOMotorClient:
    client = AsyncIOMotorClient(mongodb_container.get_connection_url())
    yield client
    client.close()


@pytest_asyncio.fixture(scope="function", autouse=True)
async def init_beanie(mongo_client: AsyncIOMotorClient, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "MONGO_DB", "peerhub_test")
    await init_database(mongo_client)
    yield


@pytest_asyncio.fixture(scope="function", autouse=True)
async def clear_database(mongo_client: AsyncIOMotorClient, init_beanie: None):
    db = mongo_client["peerhub_test"]
    for name in await db.list_collection_names():
        await db.drop_collection(name)
    yield
