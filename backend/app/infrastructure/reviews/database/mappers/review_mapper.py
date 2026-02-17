from app.domain.reviews.entities.review import Review
from app.infrastructure.reviews.database.models.review_model import ReviewDocument
from app.infrastructure.shared.database.mappers.base_mapper import (
    document_id_to_str,
    str_to_document_id,
)


class ReviewMapper:
    """Mapper to convert between Review entity and ReviewDocument model."""

    @staticmethod
    def to_entity(document: ReviewDocument) -> Review:
        """Convert ReviewDocument (MongoDB) to Review entity (domain)."""
        return Review(
            id=document_id_to_str(document),
            reviewer_uuid=document.reviewer_uuid,
            reviewed_username=document.reviewed_username,
            status=document.status,
            comment=document.comment,
            anonymous=document.anonymous,
            created_at=document.created_at,
            updated_at=document.updated_at,
            comment_hidden=document.comment_hidden,
        )

    @staticmethod
    def to_document(entity: Review) -> ReviewDocument:
        """Convert Review entity (domain) to ReviewDocument (MongoDB)."""
        doc = ReviewDocument(
            reviewer_uuid=entity.reviewer_uuid,
            reviewed_username=entity.reviewed_username,
            status=entity.status,
            comment=entity.comment,
            anonymous=entity.anonymous,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            comment_hidden=entity.comment_hidden,
        )
        # If entity has an id, set it on the document
        if entity.id:
            doc.id = str_to_document_id(entity.id)
        return doc

    @staticmethod
    def update_document_from_entity(
        document: ReviewDocument, entity: Review
    ) -> ReviewDocument:
        """Update a ReviewDocument with values from a Review entity."""
        document.reviewer_uuid = entity.reviewer_uuid
        document.reviewed_username = entity.reviewed_username
        document.status = entity.status
        document.comment = entity.comment
        document.anonymous = entity.anonymous
        document.created_at = entity.created_at
        document.updated_at = entity.updated_at
        document.comment_hidden = entity.comment_hidden
        return document
