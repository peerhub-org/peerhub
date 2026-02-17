from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.domain.accounts.entities.account import Account
from app.domain.reviews.entities.review import Review, ReviewStatus
from app.domain.reviews.services.review_service import ReviewService
from app.domain.shared.exceptions import (
    AnonymousFieldImmutableException,
    NotUserTypeException,
    ReviewValidationException,
    SelfReviewException,
)
from app.domain.users.entities.user import User


@pytest.mark.asyncio
async def test_create_review_success(
    review_service: ReviewService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    reviewer_uuid = uuid4()
    mock_account_repository.get_by_uuid.return_value = Account(
        id="a1", uuid=reviewer_uuid, username="reviewer", access_token="t"
    )
    mock_user_repository.get_by_username.return_value = None
    mock_review_repository.get_by_reviewer_and_username.return_value = None
    mock_review_repository.create.side_effect = lambda r: r

    result = await review_service.create_or_update_review(
        reviewer_uuid, "reviewed_user", ReviewStatus.APPROVE, "Nice!", False
    )

    assert result.status == ReviewStatus.APPROVE
    assert result.comment == "Nice!"
    mock_review_repository.create.assert_called_once()


@pytest.mark.asyncio
async def test_update_existing_review(
    review_service: ReviewService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    reviewer_uuid = uuid4()
    now = datetime.now(timezone.utc)
    existing = Review(
        id="r1",
        reviewer_uuid=reviewer_uuid,
        reviewed_username="bob",
        status=ReviewStatus.APPROVE,
        comment="Good",
        anonymous=False,
        created_at=now,
        updated_at=now,
    )
    mock_account_repository.get_by_uuid.return_value = Account(
        id="a1", uuid=reviewer_uuid, username="reviewer", access_token="t"
    )
    mock_user_repository.get_by_username.return_value = None
    mock_review_repository.get_by_reviewer_and_username.return_value = existing
    mock_review_repository.update.side_effect = lambda r: r

    result = await review_service.create_or_update_review(
        reviewer_uuid, "bob", ReviewStatus.REQUEST_CHANGE, "Fix this", False
    )

    assert result.status == ReviewStatus.REQUEST_CHANGE
    assert result.comment == "Fix this"
    mock_review_repository.update.assert_called_once()


@pytest.mark.asyncio
async def test_self_review_raises(
    review_service: ReviewService,
    mock_account_repository: AsyncMock,
):
    reviewer_uuid = uuid4()
    mock_account_repository.get_by_uuid.return_value = Account(
        id="a1", uuid=reviewer_uuid, username="alice", access_token="t"
    )

    with pytest.raises(SelfReviewException):
        await review_service.create_or_update_review(
            reviewer_uuid, "Alice", ReviewStatus.APPROVE, None, False
        )


@pytest.mark.asyncio
async def test_comment_required_for_comment_status(
    review_service: ReviewService,
    mock_account_repository: AsyncMock,
):
    reviewer_uuid = uuid4()
    mock_account_repository.get_by_uuid.return_value = Account(
        id="a1", uuid=reviewer_uuid, username="reviewer", access_token="t"
    )

    with pytest.raises(ReviewValidationException, match="Comment is required"):
        await review_service.create_or_update_review(
            reviewer_uuid, "bob", ReviewStatus.COMMENT, None, False
        )


@pytest.mark.asyncio
async def test_comment_exceeds_max_length(
    review_service: ReviewService,
    mock_account_repository: AsyncMock,
):
    reviewer_uuid = uuid4()
    mock_account_repository.get_by_uuid.return_value = Account(
        id="a1", uuid=reviewer_uuid, username="reviewer", access_token="t"
    )

    with pytest.raises(ReviewValidationException, match="exceeds maximum length"):
        await review_service.create_or_update_review(
            reviewer_uuid, "bob", ReviewStatus.APPROVE, "x" * 1025, False
        )


@pytest.mark.asyncio
async def test_anonymous_field_immutable(
    review_service: ReviewService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    reviewer_uuid = uuid4()
    now = datetime.now(timezone.utc)
    existing = Review(
        id="r1",
        reviewer_uuid=reviewer_uuid,
        reviewed_username="bob",
        status=ReviewStatus.APPROVE,
        comment="Good",
        anonymous=False,
        created_at=now,
        updated_at=now,
    )
    mock_account_repository.get_by_uuid.return_value = Account(
        id="a1", uuid=reviewer_uuid, username="reviewer", access_token="t"
    )
    mock_user_repository.get_by_username.return_value = None
    mock_review_repository.get_by_reviewer_and_username.return_value = existing

    with pytest.raises(AnonymousFieldImmutableException):
        await review_service.create_or_update_review(
            reviewer_uuid, "bob", ReviewStatus.APPROVE, "Good", True
        )


@pytest.mark.asyncio
async def test_get_reviews_for_user(
    review_service: ReviewService,
    mock_review_repository: AsyncMock,
    sample_review: Review,
):
    mock_review_repository.get_all_for_username.return_value = [sample_review]

    result = await review_service.get_reviews_for_user("revieweduser")

    assert len(result) == 1
    assert result[0].id == sample_review.id
    mock_review_repository.get_all_for_username.assert_called_once_with(
        "revieweduser", 100, 0, status=None
    )


@pytest.mark.asyncio
async def test_get_reviews_by_reviewer(
    review_service: ReviewService,
    mock_review_repository: AsyncMock,
    sample_review: Review,
):
    mock_review_repository.get_all_by_reviewer_uuid.return_value = [sample_review]

    result = await review_service.get_reviews_by_reviewer(sample_review.reviewer_uuid)

    assert len(result) == 1
    mock_review_repository.get_all_by_reviewer_uuid.assert_called_once_with(
        sample_review.reviewer_uuid, 100, 0
    )


@pytest.mark.asyncio
async def test_delete_review_existing(
    review_service: ReviewService,
    mock_review_repository: AsyncMock,
    sample_review: Review,
):
    mock_review_repository.get_by_reviewer_and_username.return_value = sample_review

    await review_service.delete_review(
        sample_review.reviewer_uuid, sample_review.reviewed_username
    )

    mock_review_repository.delete.assert_called_once_with(sample_review.id)


@pytest.mark.asyncio
async def test_delete_review_nonexistent(
    review_service: ReviewService,
    mock_review_repository: AsyncMock,
):
    mock_review_repository.get_by_reviewer_and_username.return_value = None

    await review_service.delete_review(uuid4(), "nobody")

    mock_review_repository.delete.assert_not_called()


@pytest.mark.asyncio
async def test_review_non_user_type_raises(
    review_service: ReviewService,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    reviewer_uuid = uuid4()
    mock_account_repository.get_by_uuid.return_value = Account(
        id="a1", uuid=reviewer_uuid, username="reviewer", access_token="t"
    )
    mock_user_repository.get_by_username.return_value = User(
        username="some-org", type="Organization"
    )

    with pytest.raises(NotUserTypeException):
        await review_service.create_or_update_review(
            reviewer_uuid, "some-org", ReviewStatus.APPROVE, "Nice!", False
        )


@pytest.mark.asyncio
async def test_review_user_type_allowed(
    review_service: ReviewService,
    mock_review_repository: AsyncMock,
    mock_account_repository: AsyncMock,
    mock_user_repository: AsyncMock,
):
    reviewer_uuid = uuid4()
    mock_account_repository.get_by_uuid.return_value = Account(
        id="a1", uuid=reviewer_uuid, username="reviewer", access_token="t"
    )
    mock_user_repository.get_by_username.return_value = User(username="bob", type="User")
    mock_review_repository.get_by_reviewer_and_username.return_value = None
    mock_review_repository.create.side_effect = lambda r: r

    result = await review_service.create_or_update_review(
        reviewer_uuid, "bob", ReviewStatus.APPROVE, "Great!", False
    )

    assert result.status == ReviewStatus.APPROVE
    mock_review_repository.create.assert_called_once()
