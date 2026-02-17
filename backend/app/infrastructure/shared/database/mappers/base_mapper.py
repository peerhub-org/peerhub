from beanie import PydanticObjectId


def document_id_to_str(document: object) -> str | None:
    """Convert a Beanie document's ObjectId to a string."""
    return str(document.id) if document.id else None  # type: ignore[attr-defined]


def str_to_document_id(id_str: str | None) -> PydanticObjectId | None:
    """Convert a string ID to a PydanticObjectId."""
    return PydanticObjectId(id_str) if id_str else None
