from dataclasses import dataclass
from datetime import datetime

from pydantic import Field

from spacenote.core.db import MongoModel, PyObjectId
from spacenote.core.field.models import FieldValueType
from spacenote.core.utils import now


@dataclass
class PaginationResult:
    """Result of a paginated query."""

    notes: list["Note"]
    total_count: int
    current_page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class Note(MongoModel):
    space_id: PyObjectId
    author_id: PyObjectId
    created_at: datetime = Field(default_factory=now)
    edited_at: datetime | None = None  # Last time note fields were edited
    fields: dict[str, FieldValueType]  # User-defined fields as defined in Space.fields
