from datetime import datetime
from typing import Any

from pydantic import Field

from spacenote.core.db import MongoModel
from spacenote.core.modules.field.models import FieldValueType
from spacenote.utils import now


class Note(MongoModel):
    """Note with custom fields stored in a space."""

    space_slug: str
    number: int  # Sequential per space, used in URLs: /spaces/{slug}/notes/{number}
    author: str  # Username of the note creator
    created_at: datetime = Field(default_factory=now)
    edited_at: datetime | None = None  # Last field edit timestamp
    commented_at: datetime | None = None  # Last comment created
    activity_at: datetime = Field(default_factory=now)  # Updated on: field edit, comment create/edit/delete
    fields: dict[str, FieldValueType]  # Values for space-defined fields
    title: str = ""  # Computed from Space.templates["note:title"], not stored in MongoDB

    def to_mongo(self) -> dict[str, Any]:
        """Exclude computed title field from MongoDB storage."""
        data = super().to_mongo()
        data.pop("title", None)
        return data
