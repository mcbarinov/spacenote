"""View models for external API consumption.

These models are designed for frontend use and contain only human-readable identifiers.
They replace ObjectId references with usernames, slugs, and numbers.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

from spacenote.core.field.models import FieldValueType

if TYPE_CHECKING:
    from spacenote.core.comment.models import Comment
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


class CommentView(BaseModel):
    """Comment on a note."""

    space_slug: str = Field(..., description="Space identifier")
    note_number: int = Field(..., description="Note number within the space")
    number: int = Field(..., description="Comment number within the note")
    author_username: str = Field(..., description="Author's username")
    content: str = Field(..., description="Comment content")
    created_at: datetime = Field(..., description="When the comment was created")
    edited_at: datetime | None = Field(None, description="When the comment was last edited")

    @classmethod
    def from_domain(cls, comment: "Comment", space_slug: str, note_number: int, author_username: str) -> "CommentView":
        """Create view model from domain model."""
        return cls(
            space_slug=space_slug,
            note_number=note_number,
            number=comment.number,
            author_username=author_username,
            content=comment.content,
            created_at=comment.created_at,
            edited_at=comment.edited_at,
        )
