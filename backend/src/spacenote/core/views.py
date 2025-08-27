"""View models for external API consumption.

These models are designed for frontend use and contain only human-readable identifiers.
They replace ObjectId references with usernames, slugs, and numbers.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

from spacenote.core.field.models import FieldValueType

if TYPE_CHECKING:
    from spacenote.core.note.models import Note


class NoteView(BaseModel):
    """Note with custom fields stored in a space."""

    space_slug: str = Field(..., description="Space identifier")
    number: int = Field(..., description="Note number within the space")
    author_username: str = Field(..., description="Author's username")
    created_at: datetime = Field(..., description="When the note was created")
    edited_at: datetime | None = Field(None, description="When the note was last edited")
    fields: dict[str, FieldValueType] = Field(..., description="Field values as defined by the space schema")

    @classmethod
    def from_domain(cls, note: "Note", space_slug: str, author_username: str) -> "NoteView":
        """Create view model from domain model."""
        return cls(
            space_slug=space_slug,
            number=note.number,
            author_username=author_username,
            created_at=note.created_at,
            edited_at=note.edited_at,
            fields=note.fields,
        )
