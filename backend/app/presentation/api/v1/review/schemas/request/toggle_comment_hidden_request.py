from pydantic import BaseModel


class ToggleCommentHiddenRequest(BaseModel):
    """Request schema for toggling comment hidden state."""

    hidden: bool
