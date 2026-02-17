from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

from app.infrastructure.shared.config.config import settings

ALGORITHM = "HS256"


def create_access_token(
    user_id: str | Any, expires_delta: timedelta | None = None
) -> str:
    """Create a JWT access token for a user."""
    if expires_delta:
        expiration = datetime.now(timezone.utc) + expires_delta
    else:
        expiration = datetime.now(timezone.utc) + timedelta(minutes=15)
    token_payload = {"exp": expiration, "sub": str(user_id)}
    return jwt.encode(token_payload, settings.SECRET_KEY, algorithm=ALGORITHM)
