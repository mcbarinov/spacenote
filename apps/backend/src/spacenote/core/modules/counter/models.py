from enum import StrEnum

from spacenote.core.db import MongoModel


class CounterType(StrEnum):
    """Types of entities that use sequential numbering."""

    NOTE = "note"
    COMMENT = "comment"
    PENDING_ATTACHMENT = "pending_attachment"
    ATTACHMENT = "attachment"


class Counter(MongoModel):
    """Atomic counter for sequential numbers per space or note."""

    space_slug: str
    counter_type: CounterType
    note_number: int | None = None  # For note-scoped counters (e.g., comments, attachments)
    seq: int = 0
