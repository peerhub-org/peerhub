from uuid import UUID

from beanie import PydanticObjectId, SortDirection

from app.domain.reviews.entities.review import Review
from app.infrastructure.reviews.database.mappers.review_mapper import ReviewMapper
from app.infrastructure.reviews.database.models.review_model import ReviewDocument
from app.infrastructure.shared.database.constants import CASE_INSENSITIVE
from app.infrastructure.shared.database.repositories.base_repository import BaseRepository


class MongoDBReviewRepository(BaseRepository[Review, ReviewDocument]):
    """MongoDB implementation of IReviewRepository interface."""

    document_class = ReviewDocument
    mapper = ReviewMapper

    async def get_by_id(self, review_id: str) -> Review | None:
        """Find a review by its ID."""
        document = await ReviewDocument.get(PydanticObjectId(review_id))
        if document is None:
            return None
        return ReviewMapper.to_entity(document)

    async def get_by_reviewer_and_username(
        self, reviewer_uuid: UUID, reviewed_username: str
    ) -> Review | None:
        """Find a review by reviewer UUID and reviewed username (case-insensitive)."""
        document = await ReviewDocument.find_one(
            {"reviewer_uuid": reviewer_uuid, "reviewed_username": reviewed_username},
            collation=CASE_INSENSITIVE,
        )
        if document is None:
            return None
        return ReviewMapper.to_entity(document)

    async def get_all_for_username(
        self,
        reviewed_username: str,
        limit: int = 100,
        offset: int = 0,
        status: str | None = None,
    ) -> list[Review]:
        """Find all reviews for a username (case-insensitive), ordered by created_at."""
        query: dict = {"reviewed_username": reviewed_username}
        if status is not None:
            query["status"] = status
        documents = (
            await ReviewDocument.find(
                query,
                collation=CASE_INSENSITIVE,
            )
            .sort([("created_at", SortDirection.DESCENDING)])
            .skip(offset)
            .limit(limit)
            .to_list()
        )
        return [ReviewMapper.to_entity(doc) for doc in documents]

    async def get_all_by_reviewer_uuid(
        self, reviewer_uuid: UUID, limit: int = 100, offset: int = 0
    ) -> list[Review]:
        """Find all reviews made by a given reviewer, ordered by created_at desc."""
        documents = (
            await ReviewDocument.find({"reviewer_uuid": reviewer_uuid})
            .sort([("created_at", SortDirection.DESCENDING)])
            .skip(offset)
            .limit(limit)
            .to_list()
        )
        return [ReviewMapper.to_entity(doc) for doc in documents]

    async def get_review_count_for_username(self, reviewed_username: str) -> int:
        """Get review count for a given username (case-insensitive)."""
        collection = ReviewDocument.get_motor_collection()
        return await collection.count_documents(
            {"reviewed_username": reviewed_username},
            collation=CASE_INSENSITIVE,
        )

    async def get_review_counts_for_usernames(
        self, usernames: list[str]
    ) -> dict[str, int]:
        """Get review counts for multiple usernames at once (case-insensitive)."""
        pipeline = [
            {"$match": {"reviewed_username": {"$in": usernames}}},
            {"$group": {"_id": "$reviewed_username", "count": {"$sum": 1}}},
        ]
        results = await ReviewDocument.aggregate(
            pipeline, collation=CASE_INSENSITIVE
        ).to_list()
        return {item["_id"]: item["count"] for item in results}

    async def delete(self, review_id: str) -> None:
        """Delete a review by ID."""
        document = await ReviewDocument.get(PydanticObjectId(review_id))
        if document:
            await document.delete()

    async def delete_all_by_reviewer_uuid(self, reviewer_uuid: UUID) -> int:
        """Delete all reviews made by a given reviewer. Returns count deleted."""
        result = await ReviewDocument.find({"reviewer_uuid": reviewer_uuid}).delete()
        return result.deleted_count if result else 0
