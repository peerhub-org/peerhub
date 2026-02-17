from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.entities.review import Review
from app.domain.reviews.value_objects.review_with_username import ReviewWithUsername
from app.domain.users.services.user_service import UserService


class ReviewEnrichmentService:
    """Resolves reviewer identity (account + GitHub profile) for reviews."""

    def __init__(self, account_service: AccountService, user_service: UserService):
        self.account_service = account_service
        self.user_service = user_service

    async def enrich_reviews(self, reviews: list[Review]) -> list[ReviewWithUsername]:
        """Batch-resolve reviewer accounts and user profiles for a list of reviews."""
        if not reviews:
            return []

        reviewer_uuids = list({r.reviewer_uuid for r in reviews})
        accounts_by_uuid = await self.account_service.get_accounts_by_uuids(
            reviewer_uuids
        )

        active_accounts = {
            uuid: acc for uuid, acc in accounts_by_uuid.items() if acc.deleted_at is None
        }

        usernames = list({acc.username for acc in active_accounts.values()})
        users_by_username = await self.user_service.get_users_by_usernames(usernames)

        results: list[ReviewWithUsername] = []
        for review in reviews:
            account = active_accounts.get(review.reviewer_uuid)
            if account is None:
                continue
            user = users_by_username.get(account.username.lower())
            results.append(
                ReviewWithUsername(
                    review=review,
                    reviewer_username=account.username,
                    reviewer_avatar_url=user.avatar_url if user else None,
                )
            )
        return results
