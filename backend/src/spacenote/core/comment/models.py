from datetime import datetime

from pydantic import BaseModel, Field

from spacenote.core.db import MongoModel, PyObjectId


class Comment(MongoModel):
    note_id: PyObjectId
    space_id: PyObjectId
    author_id: PyObjectId
    number: int  # Sequential number for comments within a note
    content: str
    created_at: datetime
    edited_at: datetime | None = None  # for future editing functionality
    parent_id: PyObjectId | None = None  # for future threading functionality


class CommentView(BaseModel):
    """Comment on a note (API representation)."""

    space_slug: str = Field(..., description="Space identifier")
    note_number: int = Field(..., description="Note number within the space")
    number: int = Field(..., description="Comment number within the note")
    author_username: str = Field(..., description="Author's username")
    content: str = Field(..., description="Comment content")
    created_at: datetime = Field(..., description="When the comment was created")
    edited_at: datetime | None = Field(None, description="When the comment was last edited")

    @classmethod
    def from_domain(cls, comment: Comment, space_slug: str, note_number: int, author_username: str) -> "CommentView":
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
