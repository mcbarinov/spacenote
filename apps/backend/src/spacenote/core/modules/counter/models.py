from enum import StrEnum

from pydantic import Field

from spacenote.core.db import MongoModel


class CounterType(StrEnum):
    """Types of entities that use sequential numbering."""

    NOTE = "note"
    COMMENT = "comment"
    PENDING_ATTACHMENT = "pending_attachment"
    ATTACHMENT = "attachment"
    TELEGRAM_TASK = "telegram_task"


class Counter(MongoModel):
    """Atomic counter for sequential numbers per space or note."""

    space_slug: str = Field(..., description="Space identifier")
    counter_type: CounterType = Field(..., description="Type of entity being counted")
    note_number: int | None = Field(default=None, description="For note-scoped counters (e.g., comments, attachments)")
    seq: int = Field(default=0, description="Current sequence value")
