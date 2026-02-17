from app.domain.users.entities.user import User
from app.infrastructure.shared.database.constants import CASE_INSENSITIVE
from app.infrastructure.shared.database.repositories.base_repository import BaseRepository
from app.infrastructure.users.database.mappers.user_mapper import UserMapper
from app.infrastructure.users.database.models.user_model import UserDocument


class MongoDBUserRepository(BaseRepository[User, UserDocument]):
    """MongoDB implementation of IUserRepository interface."""

    document_class = UserDocument
    mapper = UserMapper

    async def get_by_username(self, username: str) -> User | None:
        """Find a user by username (case-insensitive)."""
        document = await UserDocument.find_one(
            {"username": username}, collation=CASE_INSENSITIVE
        )
        if document is None:
            return None
        return UserMapper.to_entity(document)

    async def get_by_usernames(self, usernames: list[str]) -> list[User]:
        """Find users by a list of usernames (case-insensitive)."""
        documents = await UserDocument.find(
            {"username": {"$in": usernames}}, collation=CASE_INSENSITIVE
        ).to_list()
        return [UserMapper.to_entity(doc) for doc in documents]
