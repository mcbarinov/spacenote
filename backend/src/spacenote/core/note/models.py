"""Note models for content storage."""

from dataclasses import dataclass
from datetime import datetime

from pydantic import BaseModel, Field

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


class NoteView(BaseModel):
    """Note with custom fields stored in a space (API representation)."""

    space_slug: str = Field(..., description="Space identifier")
    number: int = Field(..., description="Note number within the space")
    author_username: str = Field(..., description="Author's username")
    created_at: datetime = Field(..., description="When the note was created")
    edited_at: datetime | None = Field(None, description="When the note was last edited")
    fields: dict[str, FieldValueType] = Field(..., description="Field values as defined by the space schema")

    @classmethod
    def from_domain(cls, note: Note, space_slug: str, author_username: str) -> "NoteView":
        """Create view model from domain model."""
        return cls(
            space_slug=space_slug,
            number=note.number,
            author_username=author_username,
            created_at=note.created_at,
            edited_at=note.edited_at,
            fields=note.fields,
        )
