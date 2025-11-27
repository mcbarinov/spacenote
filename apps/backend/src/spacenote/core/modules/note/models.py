from datetime import datetime

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
    fields: dict[str, FieldValueType]  # Values for space-defined fields
