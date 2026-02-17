from typing import Any, Generic, TypeVar

from beanie import Document, PydanticObjectId

TEntity = TypeVar("TEntity")
TDocument = TypeVar("TDocument", bound=Document)


class BaseRepository(Generic[TEntity, TDocument]):
    """Base repository with shared CRUD operations."""

    document_class: type[TDocument]
    mapper: Any

    async def create(self, entity: TEntity) -> TEntity:
        """Create a new entity."""
        document = self.mapper.to_document(entity)
        created_document = await document.create()
        return self.mapper.to_entity(created_document)

    async def update(self, entity: TEntity) -> TEntity:
        """Update an existing entity."""
        entity_id = getattr(entity, "id", None)
        if entity_id is None:
            raise ValueError("Cannot update entity without an id")

        document = await self.document_class.get(PydanticObjectId(entity_id))
        if document is None:
            raise ValueError(f"Document with id {entity_id} not found")

        self.mapper.update_document_from_entity(document, entity)
        await document.save()
        return self.mapper.to_entity(document)

    async def save(self, entity: TEntity) -> TEntity:
        """Save an entity (create if new, update if exists)."""
        if getattr(entity, "id", None) is None:
            return await self.create(entity)
        else:
            return await self.update(entity)
