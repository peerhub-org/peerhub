from datetime import datetime, timezone
from uuid import uuid4

from app.domain.reviews.entities.review import Review, ReviewStatus


def test_update_status():
    """Test that update_status changes status, comment, and updated_at."""
    now = datetime.now(timezone.utc)
    review = Review(
        id="r1",
        reviewer_uuid=uuid4(),
        reviewed_username="alice",
        status=ReviewStatus.APPROVE,
        comment="Good",
        anonymous=False,
        created_at=now,
        updated_at=now,
    )

    review.update_status(ReviewStatus.REQUEST_CHANGE, "Needs work")

    assert review.status == ReviewStatus.REQUEST_CHANGE
    assert review.comment == "Needs work"
    assert review.updated_at > now


def test_set_comment_hidden_true():
    """Test hiding a comment."""
    now = datetime.now(timezone.utc)
    review = Review(
        id="r1",
        reviewer_uuid=uuid4(),
        reviewed_username="alice",
        status=ReviewStatus.COMMENT,
        comment="Hello",
        anonymous=False,
        created_at=now,
        updated_at=now,
        comment_hidden=False,
    )

    review.set_comment_hidden(True)

    assert review.comment_hidden is True
    assert review.updated_at > now


def test_set_comment_hidden_false():
    """Test unhiding a comment."""
    now = datetime.now(timezone.utc)
    review = Review(
        id="r1",
        reviewer_uuid=uuid4(),
        reviewed_username="alice",
        status=ReviewStatus.COMMENT,
        comment="Hello",
        anonymous=False,
        created_at=now,
        updated_at=now,
        comment_hidden=True,
    )

    review.set_comment_hidden(False)

    assert review.comment_hidden is False
    assert review.updated_at > now
