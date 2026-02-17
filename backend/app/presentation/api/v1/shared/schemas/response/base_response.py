from datetime import datetime

from pydantic import BaseModel, field_serializer


class BaseResponse(BaseModel):
    """Base response model with UTC datetime serialization (Z suffix)."""

    @field_serializer("*")
    @classmethod
    def serialize_datetime(cls, value: object) -> object:
        """Serialize datetime fields with Z suffix for UTC."""
        if isinstance(value, datetime):
            return value.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        return value
