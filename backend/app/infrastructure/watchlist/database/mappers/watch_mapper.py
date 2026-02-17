from app.domain.watchlist.entities.watch import Watch
from app.infrastructure.shared.database.mappers.base_mapper import (
    document_id_to_str,
    str_to_document_id,
)
from app.infrastructure.watchlist.database.models.watch_model import (
    WatchDocument,
)


class WatchMapper:
    """Mapper to convert between Watch entity and WatchDocument."""

    @staticmethod
    def to_entity(document: WatchDocument) -> Watch:
        """Convert WatchDocument (MongoDB) to Watch entity (domain)."""
        return Watch(
            id=document_id_to_str(document),
            watcher_uuid=document.watcher_uuid,
            watched_username=document.watched_username,
            created_at=document.created_at,
        )

    @staticmethod
    def to_document(entity: Watch) -> WatchDocument:
        """Convert Watch entity (domain) to WatchDocument (MongoDB)."""
        doc = WatchDocument(
            watcher_uuid=entity.watcher_uuid,
            watched_username=entity.watched_username,
            created_at=entity.created_at,
        )
        if entity.id:
            doc.id = str_to_document_id(entity.id)
        return doc
