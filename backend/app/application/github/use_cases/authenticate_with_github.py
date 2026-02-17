from app.domain.accounts.entities.account import Account
from app.domain.accounts.services.account_service import AccountService
from app.domain.shared.exceptions import AccessRestrictedException
from app.domain.users.entities.user import User
from app.domain.users.services.user_service import UserService
from app.infrastructure.github.external.github_client import GitHubClient
from app.infrastructure.shared.config.config import settings


class AuthenticateWithGitHubUseCase:
    """Use case for authenticating via GitHub OAuth."""

    def __init__(self, account_service: AccountService, user_service: UserService):
        self.account_service = account_service
        self.user_service = user_service

    async def execute(self, code: str) -> Account:
        """
        Authenticate with GitHub OAuth code.
        Returns the authenticated or newly created account.
        """
        # Fetch GitHub user data and access token
        github_data, access_token = await GitHubClient.fetch_github_user_data(code)

        # Check if username is in whitelist (if configured)
        username = github_data["username"]
        if settings.ALLOWED_USERNAMES and username not in settings.ALLOWED_USERNAMES:
            raise AccessRestrictedException()

        # Get or create account using GitHub username, storing the access token
        account = await self.account_service.get_or_create_account(
            username=username, access_token=access_token
        )

        # Create/update User record with GitHub profile data
        existing_user = await self.user_service.get_user_by_username(username)
        user = User(
            id=existing_user.id if existing_user else None,
            username=username,
            name=github_data.get("name"),
            bio=github_data.get("bio"),
            avatar_url=github_data.get("avatar_url"),
            type=github_data.get("type"),
        )
        await self.user_service.save_user(user)

        return account
