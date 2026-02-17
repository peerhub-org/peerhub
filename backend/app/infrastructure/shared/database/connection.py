from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.infrastructure.accounts.database.models.account_model import AccountDocument
from app.infrastructure.reviews.database.models.review_model import ReviewDocument
from app.infrastructure.shared.config.config import settings
from app.infrastructure.users.database.models.user_model import UserDocument
from app.infrastructure.watchlist.database.models.watch_model import (
    WatchDocument,
)


async def init_database(client: AsyncIOMotorClient) -> None:
    """Initialize the database connection and document models."""
    await init_beanie(
        database=client[settings.MONGO_DB],
        document_models=[
            AccountDocument,
            ReviewDocument,
            WatchDocument,
            UserDocument,
        ],
    )
