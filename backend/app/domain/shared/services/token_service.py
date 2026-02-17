from datetime import timedelta
from uuid import UUID

from app.infrastructure.shared.config.config import settings
from app.infrastructure.shared.security.jwt_handler import create_access_token


class TokenService:
    """Service for handling JWT token operations."""

    @staticmethod
    def create_access_token_string(user_uuid: UUID) -> str:
        """Create an access token string."""
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return create_access_token(user_uuid, expires_delta=access_token_expires)
