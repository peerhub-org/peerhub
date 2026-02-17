import asyncio
from dataclasses import dataclass
from typing import Literal
from uuid import UUID

from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.entities.review import Review
from app.domain.reviews.services.review_service import ReviewService
from app.domain.users.services.user_service import UserService
from app.domain.watchlist.services.watchlist_service import WatchlistService


@dataclass
class ActivityFeedItem:
    """An item in the activity feed."""

    review: Review
    reviewer_username: str | None
    reviewer_avatar_url: str | None
    reviewed_user_avatar_url: str | None


class GetActivityFeedUseCase:
    """Use case for getting the activity feed."""

    def __init__(
        self,
        watchlist_service: WatchlistService,
        review_service: ReviewService,
        account_service: AccountService,
        user_service: UserService,
    ):
        self.watchlist_service = watchlist_service
        self.review_service = review_service
        self.account_service = account_service
        self.user_service = user_service

    async def execute(
        self,
        account_uuid: UUID,
        filter_type: Literal["all", "mine", "watching"] = "all",
        limit: int = 50,
        offset: int = 0,
    ) -> list[ActivityFeedItem]:
        """
        Get activity feed with reviews.

        - "all": Reviews for current user + reviews for watched users
        - "mine": Only reviews the current user received
        - "watching": Only reviews for watched users
        """
        account = await self.account_service.get_account_by_uuid(account_uuid)

        reviews = await self._fetch_reviews(account_uuid, account.username, filter_type)

        # Sort by updated_at descending, then paginate
        reviews.sort(key=lambda r: r.updated_at, reverse=True)
        paginated = reviews[offset : offset + limit]

        return await self._enrich_reviews(paginated)

    async def _fetch_reviews(
        self,
        account_uuid: UUID,
        username: str,
        filter_type: Literal["all", "mine", "watching"],
    ) -> list[Review]:
        """Fetch and filter reviews based on filter type."""
        usernames_to_fetch: list[str] = []

        if filter_type in ("all", "mine"):
            usernames_to_fetch.append(username)

        if filter_type in ("all", "watching"):
            watchlist = await self.watchlist_service.get_watchlist(account_uuid)
            usernames_to_fetch.extend(watch.watched_username for watch in watchlist)

        if not usernames_to_fetch:
            return []

        # Batch fetch reviews for all usernames
        review_tasks = [
            self.review_service.get_reviews_for_user(u) for u in usernames_to_fetch
        ]
        review_lists = await asyncio.gather(*review_tasks)
        all_reviews: list[Review] = []
        for review_list in review_lists:
            all_reviews.extend(review_list)

        # Batch fetch accounts for filtering
        reviewed_usernames = list({r.reviewed_username for r in all_reviews})
        accounts_map = await self.account_service.get_accounts_by_usernames(
            reviewed_usernames
        )

        filtered: list[Review] = []
        for review in all_reviews:
            reviewed_account = accounts_map.get(review.reviewed_username.lower())
            is_deleted = (
                reviewed_account is not None and reviewed_account.deleted_at is not None
            )
            is_draft = reviewed_account is None

            if is_deleted:
                continue
            if is_draft and review.reviewer_uuid != account_uuid:
                continue
            filtered.append(review)

        return filtered

    async def _enrich_reviews(
        self,
        reviews: list[Review],
    ) -> list[ActivityFeedItem]:
        """Enrich reviews with user info (batch)."""
        if not reviews:
            return []

        # Batch fetch reviewer accounts (skip missing ones gracefully)
        reviewer_uuids = list({r.reviewer_uuid for r in reviews})
        reviewer_accounts = await self.account_service.get_accounts_by_uuids(
            reviewer_uuids
        )

        # Collect all usernames we need for user profile lookups
        all_usernames = list({r.reviewed_username for r in reviews})
        for acc in reviewer_accounts.values():
            if acc.username.lower() not in {u.lower() for u in all_usernames}:
                all_usernames.append(acc.username)

        # Batch fetch user profiles
        users_map = await self.user_service.get_users_by_usernames(all_usernames)

        result: list[ActivityFeedItem] = []
        for review in reviews:
            reviewer_account = reviewer_accounts.get(review.reviewer_uuid)
            if reviewer_account is None or reviewer_account.deleted_at is not None:
                continue

            reviewer_username = None
            reviewer_avatar_url = None

            if not review.anonymous:
                reviewer_username = reviewer_account.username
                reviewer_user = users_map.get(reviewer_account.username.lower())
                if reviewer_user:
                    reviewer_avatar_url = reviewer_user.avatar_url

            reviewed_user = users_map.get(review.reviewed_username.lower())
            reviewed_user_avatar_url = reviewed_user.avatar_url if reviewed_user else None

            result.append(
                ActivityFeedItem(
                    review=review,
                    reviewer_username=reviewer_username,
                    reviewer_avatar_url=reviewer_avatar_url,
                    reviewed_user_avatar_url=reviewed_user_avatar_url,
                )
            )

        return result
