from datetime import datetime

from pydantic import Field

from spacenote.core.db import MongoModel
from spacenote.utils import now


class Comment(MongoModel):
    """Comment on a note with optional threading support."""

    space_slug: str = Field(..., description="Space identifier")
    note_number: int = Field(..., description="Note number within space")
    number: int = Field(..., description="Sequential per note, part of natural key")
    author: str = Field(..., description="Username of comment creator")
    content: str = Field(..., description="Comment text content")
    created_at: datetime = Field(default_factory=now, description="Creation timestamp")
    edited_at: datetime | None = Field(default=None, description="Last edit timestamp")
    parent_number: int | None = Field(default=None, description="Reply to comment N (None = top-level)")
