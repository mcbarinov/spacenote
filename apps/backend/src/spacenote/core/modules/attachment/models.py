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

    number: int  # Global sequential, natural key
    author: str  # Username, for ownership verification
    filename: str  # Original filename
    size: int  # Bytes
    mime_type: str
    created_at: datetime = Field(default_factory=now)


class Attachment(MongoModel):
    """File attachment belonging to a note or space.

    Two types of attachments:
    - Note-level: attached to specific note (note_number is set)
    - Space-level: attached to space itself (note_number is None), e.g. AI context documents

    Natural key: (space_slug, note_number, number)
    Storage: {space_slug}/{note_number}/{number} or {space_slug}/__space__/{number}
    """

    space_slug: str
    note_number: int | None  # None = space-level attachment
    number: int  # Sequential per note or per space
    author: str  # Username
    filename: str  # Original filename
    size: int  # Bytes
    mime_type: str
    created_at: datetime = Field(default_factory=now)
