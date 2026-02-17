from datetime import datetime, timezone
from uuid import uuid4

from app.application.reviews.use_cases.get_reviews import ReviewWithUsername
from app.domain.reviews.entities.review import Review, ReviewStatus
from app.presentation.api.v1.review.schemas.response import ReviewResponse


def _make_review(comment_hidden: bool) -> Review:
    now = datetime.now(timezone.utc)
    return Review(
        id="r1",
        reviewer_uuid=uuid4(),
        reviewed_username="bob",
        status=ReviewStatus.COMMENT,
        comment="Secret comment",
        anonymous=False,
        created_at=now,
        updated_at=now,
        comment_hidden=comment_hidden,
    )


def test_review_response_hides_comment_when_hidden_and_not_owner():
    review = _make_review(comment_hidden=True)
    review_with_username = ReviewWithUsername(
        review=review, reviewer_username="alice", reviewer_avatar_url=None
    )

    response = ReviewResponse.from_review_with_username(
        review_with_username, is_page_owner=False
    )

    assert response.comment is None
    assert response.comment_hidden is True


def test_review_response_shows_comment_for_page_owner():
    review = _make_review(comment_hidden=True)
    review_with_username = ReviewWithUsername(
        review=review, reviewer_username="alice", reviewer_avatar_url=None
    )

    response = ReviewResponse.from_review_with_username(
        review_with_username, is_page_owner=True
    )

    assert response.comment == "Secret comment"
    assert response.comment_hidden is True
