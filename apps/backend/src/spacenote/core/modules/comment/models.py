from datetime import datetime

from pydantic import Field

from spacenote.core.db import MongoModel
from spacenote.utils import now


class Comment(MongoModel):
    """Comment on a note with optional threading support."""

    space_slug: str
    note_number: int
    number: int  # Sequential per note, part of natural key
    author: str  # Username of comment creator
    content: str
    created_at: datetime = Field(default_factory=now)
    edited_at: datetime | None = None
    parent_number: int | None = None  # Reply to comment N (None = top-level)
