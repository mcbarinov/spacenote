from datetime import datetime

from pydantic import Field

from spacenote.core.db import MongoModel
from spacenote.utils import now


class PendingAttachment(MongoModel):
    """Temporary attachment waiting to be attached to a note.

    Uploaded files live here until note is created/updated.
    Then moved to Attachment collection.
    Storage: pending/{number}
    """

    number: int = Field(..., description="Global sequential, natural key")
    author: str = Field(..., description="Username, for ownership verification")
    filename: str = Field(..., description="Original filename")
    size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type")
    created_at: datetime = Field(default_factory=now, description="Upload timestamp")


class Attachment(MongoModel):
    """File attachment belonging to a note or space.

    Two types of attachments:
    - Note-level: attached to specific note (note_number is set)
    - Space-level: attached to space itself (note_number is None), e.g. AI context documents

    Natural key: (space_slug, note_number, number)
    Storage: {space_slug}/{note_number}/{number} or {space_slug}/__space__/{number}
    """

    space_slug: str = Field(..., description="Space identifier")
    note_number: int | None = Field(..., description="Note number (None = space-level attachment)")
    number: int = Field(..., description="Sequential per note or per space")
    author: str = Field(..., description="Username")
    filename: str = Field(..., description="Original filename")
    size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type")
    created_at: datetime = Field(default_factory=now, description="Upload timestamp")
