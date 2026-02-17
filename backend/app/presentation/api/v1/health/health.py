import logging

from fastapi import APIRouter
from motor.motor_asyncio import AsyncIOMotorClient

from app.infrastructure.shared.config.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("")
async def health_check() -> dict[str, str]:
    """Health check endpoint with database connectivity verification."""
    db_status = "healthy"
    try:
        client: AsyncIOMotorClient = AsyncIOMotorClient(
            settings.MONGO_URI, serverSelectionTimeoutMS=2000
        )
        await client.admin.command("ping")
        client.close()
    except Exception:
        logger.warning("Database health check failed")
        db_status = "unhealthy"

    status = "healthy" if db_status == "healthy" else "degraded"
    logger.info("Health check: status=%s, database=%s", status, db_status)
    return {
        "status": status,
        "database": db_status,
        "version": settings.PROJECT_NAME,
    }
