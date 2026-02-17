from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from jwt.exceptions import PyJWTError

from app.infrastructure.shared.config.config import settings
from app.infrastructure.shared.security.jwt_handler import ALGORITHM
from app.infrastructure.shared.security.oauth2_scheme import cookie_token_extractor


async def get_current_account_uuid(
    token: str = Depends(cookie_token_extractor),
) -> UUID:
    """Extract and validate account UUID from JWT token."""
    unauthorized_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        account_id_str: str | None = decoded_token.get("sub")
        if account_id_str is None:
            raise unauthorized_error
        account_uuid = UUID(account_id_str)
    except PyJWTError:
        raise unauthorized_error from None
    except ValueError:
        raise unauthorized_error from None

    return account_uuid
