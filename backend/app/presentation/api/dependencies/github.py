from fastapi import Depends

from app.application.github.use_cases.authenticate_with_github import (
    AuthenticateWithGitHubUseCase,
)
from app.application.github.use_cases.get_user import GetUserUseCase
from app.application.github.use_cases.search_users import SearchUsersUseCase
from app.domain.accounts.services.account_service import AccountService
from app.domain.users.services.user_service import UserService
from app.infrastructure.email.email_service import EmailService

from .services import (
    get_account_service,
    get_email_service,
    get_user_service,
)


def get_authenticate_with_github_use_case(
    account_service: AccountService = Depends(get_account_service),
    user_service: UserService = Depends(get_user_service),
    email_service: EmailService = Depends(get_email_service),
) -> AuthenticateWithGitHubUseCase:
    """Get authenticate with GitHub use case instance."""
    return AuthenticateWithGitHubUseCase(
        account_service, user_service, email_service
    )


def get_user_use_case(
    account_service: AccountService = Depends(get_account_service),
    user_service: UserService = Depends(get_user_service),
) -> GetUserUseCase:
    """Get user use case instance."""
    return GetUserUseCase(account_service, user_service)


def get_search_users_use_case(
    account_service: AccountService = Depends(get_account_service),
) -> SearchUsersUseCase:
    """Get search users use case instance."""
    return SearchUsersUseCase(account_service)
