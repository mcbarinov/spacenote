from datetime import datetime
from typing import Any

from pydantic import Field

from spacenote.core.db import MongoModel
from spacenote.core.modules.field.models import FieldValueType
from spacenote.utils import now


class Note(MongoModel):
    """Note with custom fields stored in a space."""

    space_slug: str = Field(..., description="Space identifier")
    number: int = Field(..., description="Sequential per space, used in URLs: /spaces/{slug}/notes/{number}")
    author: str = Field(..., description="Username of the note creator")
    created_at: datetime = Field(default_factory=now, description="Creation timestamp")
    edited_at: datetime | None = Field(default=None, description="Last field edit timestamp")
    commented_at: datetime | None = Field(default=None, description="Last comment timestamp")
    activity_at: datetime = Field(default_factory=now, description="Updated on: field edit, comment create/edit/delete")
    fields: dict[str, FieldValueType] = Field(..., description="Values for space-defined fields")
    title: str = Field(default="", description="Computed from Space.templates['note:title'], not stored in MongoDB")

    def to_mongo(self) -> dict[str, Any]:
        """Exclude computed title field from MongoDB storage."""
        data = super().to_mongo()
        data.pop("title", None)
        return data
