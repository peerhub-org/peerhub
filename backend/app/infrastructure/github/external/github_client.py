import logging

import httpx

from app.domain.shared.exceptions import GitHubAPIException, UserNotFoundException
from app.infrastructure.shared.config.config import settings
from app.infrastructure.shared.constants import GITHUB_API_TIMEOUT_SECONDS

logger = logging.getLogger(__name__)

GITHUB_TIMEOUT = httpx.Timeout(GITHUB_API_TIMEOUT_SECONDS)


class GitHubClient:
    """Client for interacting with GitHub API and OAuth."""

    GITHUB_API_URL = "https://api.github.com"
    GITHUB_OAUTH_URL = "https://github.com/login/oauth/access_token"

    @staticmethod
    async def exchange_code_for_token(code: str) -> str | None:
        """Exchange OAuth authorization code for access token."""
        redirect_uri = f"{settings.SSO_CALLBACK_HOSTNAME}/oauth/callback"
        async with httpx.AsyncClient(timeout=GITHUB_TIMEOUT) as client:
            response = await client.post(
                GitHubClient.GITHUB_OAUTH_URL,
                data={
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
                headers={"Accept": "application/json"},
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("access_token")
        logger.warning(
            "Failed to exchange code for token: status=%d",
            response.status_code,
        )
        return None

    @staticmethod
    async def fetch_authenticated_user(access_token: str) -> dict | None:
        """Fetch authenticated user data from GitHub."""
        async with httpx.AsyncClient(timeout=GITHUB_TIMEOUT) as client:
            response = await client.get(
                f"{GitHubClient.GITHUB_API_URL}/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github+json",
                },
            )
            if response.status_code == 200:
                return response.json()
        logger.warning(
            "Failed to fetch authenticated user: status=%d",
            response.status_code,
        )
        return None

    @staticmethod
    async def fetch_github_user_data(code: str) -> tuple[dict, str]:
        """
        Complete OAuth flow: exchange code for token and fetch user data.
        Returns a tuple of (user_data dict, access_token).
        """
        access_token = await GitHubClient.exchange_code_for_token(code)
        if not access_token:
            raise GitHubAPIException("Failed to get access token from GitHub.")

        user_data = await GitHubClient.fetch_authenticated_user(access_token)
        if user_data is None:
            raise GitHubAPIException("Failed to fetch user data from GitHub.")

        return {
            "username": user_data["login"],
            "name": user_data.get("name"),
            "bio": user_data.get("bio"),
            "avatar_url": user_data.get("avatar_url"),
            "type": user_data.get("type"),
        }, access_token

    @staticmethod
    async def fetch_user_by_username(username: str, access_token: str) -> dict:
        """Fetch GitHub user by username."""
        async with httpx.AsyncClient(timeout=GITHUB_TIMEOUT) as client:
            response = await client.get(
                f"{GitHubClient.GITHUB_API_URL}/users/{username}",
                headers={
                    "Accept": "application/vnd.github+json",
                    "Authorization": f"Bearer {access_token}",
                },
            )

        if response.status_code == 404:
            raise UserNotFoundException(username)

        if response.status_code != 200:
            logger.error(
                "GitHub API error fetching user %s: status=%d",
                username,
                response.status_code,
            )
            raise GitHubAPIException("Failed to fetch GitHub user")

        data = response.json()
        return {
            "username": data.get("login"),
            "name": data.get("name"),
            "bio": data.get("bio"),
            "avatar_url": data.get("avatar_url"),
            "type": data.get("type"),
        }

    @staticmethod
    async def search_users(query: str, access_token: str) -> list[dict]:
        """Search GitHub users by query."""
        async with httpx.AsyncClient(timeout=GITHUB_TIMEOUT) as client:
            response = await client.get(
                f"{GitHubClient.GITHUB_API_URL}/search/users",
                params={"q": f"type:user {query}"},
                headers={
                    "Accept": "application/vnd.github+json",
                    "Authorization": f"Bearer {access_token}",
                },
            )

        if response.status_code != 200:
            logger.error(
                "GitHub API error searching users: status=%d",
                response.status_code,
            )
            raise GitHubAPIException("Failed to search GitHub users")

        data = response.json()
        return [
            {
                "login": item["login"],
                "avatar_url": item["avatar_url"],
                "type": item.get("type"),
            }
            for item in data.get("items", [])
        ]

    @staticmethod
    async def fetch_following_sample(
        username: str, access_token: str, per_page: int = 100
    ) -> list[dict]:
        """Fetch a single-page sample of GitHub users the given username is following."""
        async with httpx.AsyncClient(timeout=GITHUB_TIMEOUT) as client:
            response = await client.get(
                f"{GitHubClient.GITHUB_API_URL}/users/{username}/following",
                params={"per_page": per_page},
                headers={
                    "Accept": "application/vnd.github+json",
                    "Authorization": f"Bearer {access_token}",
                },
            )

        if response.status_code != 200:
            logger.error(
                "GitHub API error fetching following for %s: status=%d",
                username,
                response.status_code,
            )
            raise GitHubAPIException("Failed to fetch GitHub following list")

        data = response.json()
        return [
            {
                "login": item.get("login"),
                "avatar_url": item.get("avatar_url"),
                "type": item.get("type"),
            }
            for item in data
        ]
