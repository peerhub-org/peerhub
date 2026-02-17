from uuid import UUID

from app.domain.accounts.repositories.account_repository import IAccountRepository
from app.domain.shared.exceptions import NotUserTypeException
from app.domain.users.repositories.user_repository import IUserRepository


async def check_not_self_action(
    account_repository: IAccountRepository,
    actor_uuid: UUID,
    target_username: str,
    exception_class: type[Exception],
) -> None:
    """Check if user is trying to perform an action on themselves (case-insensitive)."""
    account = await account_repository.get_by_uuid(actor_uuid)
    if account and account.username.lower() == target_username.lower():
        raise exception_class(target_username)


async def check_target_is_user_type(
    user_repository: IUserRepository,
    target_username: str,
) -> None:
    """Check that the target is a regular User type (not Organization or Bot)."""
    user = await user_repository.get_by_username(target_username)
    if user is not None and not user.is_user_type:
        raise NotUserTypeException(target_username)
