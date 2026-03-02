from dataclasses import dataclass
from uuid import UUID

from app.domain.accounts.services.account_service import AccountService
from app.domain.reviews.services.review_enrichment_service import ReviewEnrichmentService
from app.domain.reviews.services.review_service import ReviewService
from app.domain.reviews.value_objects.review_with_username import ReviewWithUsername
from app.domain.shared.exceptions import (
    ReviewNotFoundException,
    UnauthorizedActionException,
)
from app.infrastructure.shared.config.config import settings


@dataclass
class ToggleCommentHiddenResult:
    """Result of toggling comment hidden state, with caller context."""

    review_with_username: ReviewWithUsername
    is_page_owner: bool
    is_moderator: bool


class ToggleCommentHiddenUseCase:
    """Use case for toggling the hidden state of a review comment."""

    def __init__(
        self,
        review_service: ReviewService,
        account_service: AccountService,
        enrichment_service: ReviewEnrichmentService,
    ):
        self.review_service = review_service
        self.account_service = account_service
        self.enrichment_service = enrichment_service

    async def execute(
        self, review_id: str, current_account_uuid: UUID, hidden: bool
    ) -> ToggleCommentHiddenResult:
        """
        Toggle the hidden state of a review comment.

        Page owner and moderators can hide/unhide comments.
        Each actor can only unhide comments they themselves hid.
        Moderators can also unhide other moderator hides.
        """
        review = await self.review_service.get_review_by_id(review_id)
        if review is None:
            raise ReviewNotFoundException(review_id)

        current_account = await self.account_service.get_account_by_uuid(
            current_account_uuid
        )

        is_page_owner = current_account.username == review.reviewed_username
        is_moderator = current_account.username in settings.MODERATOR_USERNAMES

        if not is_page_owner and not is_moderator:
            raise UnauthorizedActionException(
                "Only the page owner or moderators can hide/unhide comments"
            )

        if hidden:
            hidden_by = current_account.username
        else:
            # Can only unhide what you hid;
            # moderators can also unhide other moderator hides
            if review.comment_hidden_by == current_account.username:
                hidden_by = None
            elif is_moderator and review.comment_hidden_by != review.reviewed_username:
                # Moderator unhiding another moderator's hide
                hidden_by = None
            else:
                raise UnauthorizedActionException(
                    "You can only unhide comments that you hid"
                )

        review.set_comment_hidden(hidden, hidden_by)
        updated_review = await self.review_service.update_review(review)
        enriched = await self.enrichment_service.enrich_reviews([updated_review])

        return ToggleCommentHiddenResult(
            review_with_username=enriched[0],
            is_page_owner=is_page_owner,
            is_moderator=is_moderator,
        )
