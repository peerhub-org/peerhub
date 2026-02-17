import asyncio
import random
from uuid import UUID

from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.shared.exceptions import AccessTokenMissingException
from app.domain.watchlist.services.watchlist_service import WatchlistService
from app.infrastructure.github.external.github_client import GitHubClient


class GetSuggestionsUseCase:
    """Use case for suggesting accounts based on GitHub following list."""

    def __init__(
        self,
        account_service: AccountService,
        watchlist_service: WatchlistService,
        review_service: ReviewService,
    ) -> None:
        self.account_service = account_service
        self.watchlist_service = watchlist_service
        self.review_service = review_service

    async def execute(self, account_uuid: UUID, limit: int = 4) -> list[dict]:
        """Get suggestions to review."""
        account = await self.account_service.get_account_by_uuid(account_uuid)
        if not account.access_token:
            raise AccessTokenMissingException()

        # Fetch GitHub following, watching, and user's reviews in parallel
        following, watching, reviewer_reviews = await asyncio.gather(
            GitHubClient.fetch_following_sample(account.username, account.access_token),
            self.watchlist_service.get_watchlist(account_uuid, limit=500, offset=0),
            self.review_service.get_reviews_by_reviewer(
                account_uuid, limit=500, offset=0
            ),
        )

        candidates = self._build_candidates(
            following, watching, reviewer_reviews, account.username
        )

        if not candidates:
            return []

        usernames = list(candidates.keys())

        # Batch DB queries: 2 queries instead of up to 2*N
        accounts_map, review_counts = await asyncio.gather(
            self.account_service.get_accounts_by_usernames(usernames),
            self.review_service.get_review_counts_for_usernames(usernames),
        )

        suggestions: list[dict] = []
        for username_lower, item in candidates.items():
            existing_account = accounts_map.get(username_lower)
            if existing_account and existing_account.deleted_at is not None:
                continue

            has_open_account = (
                existing_account is not None and existing_account.deleted_at is None
            )

            suggestions.append(
                {
                    "username": item["login"],
                    "avatar_url": item.get("avatar_url"),
                    "has_open_account": has_open_account,
                    "review_count": review_counts.get(username_lower, 0),
                }
            )

        return self._score_and_sort(suggestions, limit)

    @staticmethod
    def _build_candidates(
        following: list[dict],
        watchlist: list,
        reviewer_reviews: list,
        own_username: str,
    ) -> dict[str, dict]:
        """Filter following list into candidates."""
        watched_usernames = {watch.watched_username.lower() for watch in watchlist}
        reviewed_usernames = {
            review.reviewed_username.lower() for review in reviewer_reviews
        }

        candidates: dict[str, dict] = {}
        for item in following:
            username = item.get("login")
            if not username:
                continue
            if item.get("type") != "User":
                continue

            username_lower = username.lower()
            if username_lower == own_username.lower():
                continue
            if username_lower in watched_usernames:
                continue
            if username_lower in reviewed_usernames:
                continue

            candidates[username_lower] = item

        return candidates

    @staticmethod
    def _score_and_sort(suggestions: list[dict], limit: int) -> list[dict]:
        """Prioritize and sort suggestions."""
        prioritized = [
            s for s in suggestions if s["has_open_account"] or s["review_count"] > 0
        ]
        rest = [
            s for s in suggestions if not s["has_open_account"] and s["review_count"] == 0
        ]

        prioritized.sort(
            key=lambda item: (
                not item["has_open_account"],
                -item["review_count"],
                item["username"].lower(),
            )
        )
        random.shuffle(rest)

        return (prioritized + rest)[:limit]
