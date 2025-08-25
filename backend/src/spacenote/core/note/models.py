"""Note models for content storage."""

from dataclasses import dataclass
from datetime import datetime

from pydantic import Field

from spacenote.core.db import MongoModel, PyObjectId
from spacenote.core.field.models import FieldValueType
from spacenote.core.utils import now


@dataclass
class PaginationResult:
    """Paginated query result."""

    notes: list["Note"]
    total_count: int
    current_page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class Note(MongoModel):
    """Note with custom fields stored in a space.

    Indexed on (space_id, number) - unique, space_id, created_at.
    """

    space_id: PyObjectId
    number: int  # Sequential per space, used in URLs: /spaces/{slug}/notes/{number}
    author_id: PyObjectId
    created_at: datetime = Field(default_factory=now)
    edited_at: datetime | None = None  # Last field edit timestamp
    fields: dict[str, FieldValueType]  # Values for space-defined fields
