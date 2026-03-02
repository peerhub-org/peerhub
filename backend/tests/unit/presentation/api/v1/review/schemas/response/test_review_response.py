from datetime import datetime, timezone
from uuid import uuid4

from app.application.reviews.use_cases.get_reviews import ReviewWithUsername
from app.domain.reviews.entities.review import Review, ReviewStatus, Role
from app.presentation.api.v1.review.schemas.response import ReviewResponse


def _make_review(
    comment_hidden: bool, comment_hidden_by: str | None = None
) -> Review:
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
        comment_hidden_by=comment_hidden_by,
    )


def test_review_response_hides_comment_when_hidden_by_owner_and_not_owner():
    review = _make_review(comment_hidden=True, comment_hidden_by="bob")
    review_with_username = ReviewWithUsername(
        review=review, reviewer_username="alice", reviewer_avatar_url=None
    )

    response = ReviewResponse.from_review_with_username(
        review_with_username, is_page_owner=False
    )

    assert response.comment is None
    assert response.comment_hidden is True
    assert response.comment_hidden_by == Role.USER


def test_review_response_shows_comment_for_page_owner_when_hidden_by_owner():
    review = _make_review(comment_hidden=True, comment_hidden_by="bob")
    review_with_username = ReviewWithUsername(
        review=review, reviewer_username="alice", reviewer_avatar_url=None
    )

    response = ReviewResponse.from_review_with_username(
        review_with_username, is_page_owner=True
    )

    assert response.comment == "Secret comment"
    assert response.comment_hidden is True
    assert response.comment_hidden_by == Role.USER


def test_review_response_hides_comment_when_hidden_by_moderator_and_not_moderator():
    review = _make_review(comment_hidden=True, comment_hidden_by="mod_user")
    review_with_username = ReviewWithUsername(
        review=review, reviewer_username="alice", reviewer_avatar_url=None
    )

    response = ReviewResponse.from_review_with_username(
        review_with_username, is_page_owner=True, is_moderator=False
    )

    assert response.comment is None
    assert response.comment_hidden is True
    assert response.comment_hidden_by == Role.MODERATOR


def test_review_response_shows_comment_for_moderator_when_hidden_by_moderator():
    review = _make_review(comment_hidden=True, comment_hidden_by="mod_user")
    review_with_username = ReviewWithUsername(
        review=review, reviewer_username="alice", reviewer_avatar_url=None
    )

    response = ReviewResponse.from_review_with_username(
        review_with_username, is_page_owner=False, is_moderator=True
    )

    assert response.comment == "Secret comment"
    assert response.comment_hidden is True
    assert response.comment_hidden_by == Role.MODERATOR
