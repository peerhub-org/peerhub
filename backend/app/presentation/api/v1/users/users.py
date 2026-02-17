import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.application.github.use_cases.authenticate_with_github import (
    AuthenticateWithGitHubUseCase,
)
from app.application.github.use_cases.get_user import GetUserUseCase
from app.application.github.use_cases.search_users import SearchUsersUseCase
from app.domain.accounts.services.account_service import AccountService
from app.domain.shared.exceptions import DomainException
from app.domain.shared.services.token_service import TokenService
from app.infrastructure.shared.config.config import settings
from app.infrastructure.shared.constants import (
    GITHUB_OAUTH_AUTHORIZE_URL,
    GITHUB_OAUTH_SCOPE,
    RATE_LIMIT_AUTH_EXCHANGE,
    RATE_LIMIT_USER_REFRESH,
    RATE_LIMIT_USER_SEARCH,
)
from app.presentation.api.dependencies.auth import get_current_account_uuid
from app.presentation.api.dependencies.github import (
    get_authenticate_with_github_use_case,
    get_search_users_use_case,
    get_user_use_case,
)
from app.presentation.api.dependencies.services import get_account_service
from app.presentation.api.v1.users.schemas.request import ExchangeCodeRequest
from app.presentation.api.v1.users.schemas.response import (
    OAuthUrlResponse,
    TokenResponse,
    UserResponse,
    UserSearchItem,
    UserSearchResponse,
)

router = APIRouter()
token_service = TokenService()
logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)


@router.get("/auth", response_model=OAuthUrlResponse)
async def github_auth() -> OAuthUrlResponse:
    """Get GitHub OAuth login URL."""
    client_id = settings.GITHUB_CLIENT_ID
    redirect_uri = f"{settings.SSO_CALLBACK_HOSTNAME}/oauth/callback"
    scope = GITHUB_OAUTH_SCOPE

    oauth_url = (
        GITHUB_OAUTH_AUTHORIZE_URL
        + f"?client_id={client_id}"
        + f"&redirect_uri={redirect_uri}"
        + f"&scope={scope}"
    )

    return OAuthUrlResponse(url=oauth_url)


@router.post("/exchange-token", response_model=TokenResponse)
@limiter.limit(RATE_LIMIT_AUTH_EXCHANGE)
async def exchange_token(
    request: Request,
    body: ExchangeCodeRequest,
    use_case: AuthenticateWithGitHubUseCase = Depends(
        get_authenticate_with_github_use_case
    ),
) -> TokenResponse:
    """Exchange GitHub OAuth code for access token."""
    if not body.code:
        raise HTTPException(status_code=400, detail="Authorization code not provided.")

    try:
        account = await use_case.execute(body.code)
        access_token = token_service.create_access_token_string(account.uuid)
        return TokenResponse(token=access_token)
    except DomainException:
        raise
    except Exception:
        logger.exception("Unexpected error during authentication")
        raise HTTPException(status_code=400, detail="Authentication failed") from None


@router.get("/search", response_model=UserSearchResponse)
@limiter.limit(RATE_LIMIT_USER_SEARCH)
async def search_users(
    request: Request,
    q: str,
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: SearchUsersUseCase = Depends(get_search_users_use_case),
) -> UserSearchResponse:
    """Search GitHub users by query."""
    users = await use_case.execute(q, account_uuid)
    return UserSearchResponse(users=[UserSearchItem(**user) for user in users])


@router.get("/{username}", response_model=UserResponse)
async def get_user(
    username: str,
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: GetUserUseCase = Depends(get_user_use_case),
) -> UserResponse:
    """Get a GitHub user by username."""
    user = await use_case.execute(username, account_uuid)
    return UserResponse.from_entity(user)


@router.post("/{username}/refresh", response_model=UserResponse)
@limiter.limit(RATE_LIMIT_USER_REFRESH)
async def refresh_user(
    request: Request,
    username: str,
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: GetUserUseCase = Depends(get_user_use_case),
    account_service: AccountService = Depends(get_account_service),
) -> UserResponse:
    """Force-refresh a GitHub user's data from GitHub."""
    account = await account_service.get_account_by_uuid(account_uuid)
    if account.username != username:
        raise HTTPException(
            status_code=403,
            detail="You can only refresh your own profile data.",
        )

    user = await use_case.execute(username, account_uuid, force_refresh=True)
    return UserResponse.from_entity(user)
