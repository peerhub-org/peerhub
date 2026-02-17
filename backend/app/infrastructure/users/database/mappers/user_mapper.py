from app.domain.users.entities.user import User
from app.infrastructure.shared.database.mappers.base_mapper import (
    document_id_to_str,
    str_to_document_id,
)
from app.infrastructure.users.database.models.user_model import UserDocument


class UserMapper:
    """Mapper to convert between User entity and UserDocument model."""

    @staticmethod
    def to_entity(document: UserDocument) -> User:
        """Convert UserDocument (MongoDB) to User entity (domain)."""
        return User(
            id=document_id_to_str(document),
            username=document.username,
            name=document.name,
            bio=document.bio,
            avatar_url=document.avatar_url,
            type=document.type,
            updated_at=document.updated_at,
        )

    @staticmethod
    def to_document(entity: User) -> UserDocument:
        """Convert User entity (domain) to UserDocument (MongoDB)."""
        doc = UserDocument(
            username=entity.username,
            name=entity.name,
            bio=entity.bio,
            avatar_url=entity.avatar_url,
            type=entity.type,
        )
        if entity.id:
            doc.id = str_to_document_id(entity.id)
        if entity.updated_at:
            doc.updated_at = entity.updated_at
        return doc

    @staticmethod
    def update_document_from_entity(document: UserDocument, entity: User) -> UserDocument:
        """Update a UserDocument with values from a User entity."""
        document.username = entity.username
        document.name = entity.name
        document.bio = entity.bio
        document.avatar_url = entity.avatar_url
        document.type = entity.type
        if entity.updated_at:
            document.updated_at = entity.updated_at
        return document
