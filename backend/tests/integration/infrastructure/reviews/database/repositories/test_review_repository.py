from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest

from app.domain.reviews.entities.review import Review, ReviewStatus
from app.infrastructure.reviews.database.repositories.mongodb_review_repository import (
    MongoDBReviewRepository,
)


@pytest.mark.asyncio
async def test_review_repository_case_insensitive_username_and_counts():
    repo = MongoDBReviewRepository()
    reviewer_uuid = uuid4()
    now = datetime.now(timezone.utc)
    review = Review(
        id=None,
        reviewer_uuid=reviewer_uuid,
        reviewed_username="Bob",
        status=ReviewStatus.APPROVE,
        comment=None,
        anonymous=False,
        created_at=now,
        updated_at=now,
    )

    await repo.create(review)
    fetched = await repo.get_by_reviewer_and_username(reviewer_uuid, "bob")
    assert fetched is not None

    count = await repo.get_review_count_for_username("bob")
    assert count == 1

    counts = await repo.get_review_counts_for_usernames(["bob"])
    assert counts["Bob"] == 1


@pytest.mark.asyncio
async def test_review_repository_sort_and_delete():
    repo = MongoDBReviewRepository()
    reviewer_uuid = uuid4()
    other_reviewer_uuid = uuid4()
    now = datetime.now(timezone.utc)
    older = Review(
        id=None,
        reviewer_uuid=reviewer_uuid,
        reviewed_username="alice",
        status=ReviewStatus.APPROVE,
        comment=None,
        anonymous=False,
        created_at=now - timedelta(days=1),
        updated_at=now - timedelta(days=1),
    )
    newer = Review(
        id=None,
        reviewer_uuid=other_reviewer_uuid,
        reviewed_username="alice",
        status=ReviewStatus.COMMENT,
        comment="Nice",
        anonymous=False,
        created_at=now,
        updated_at=now,
    )

    older_created = await repo.create(older)
    newer_created = await repo.create(newer)

    results = await repo.get_all_for_username("alice")
    assert results[0].id == newer_created.id
    assert results[1].id == older_created.id

    await repo.delete(newer_created.id)
    remaining = await repo.get_all_for_username("alice")
    assert len(remaining) == 1
    assert remaining[0].id == older_created.id
