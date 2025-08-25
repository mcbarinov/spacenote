"""Auto-incrementing counters for sequential numbering."""

from enum import StrEnum

from spacenote.core.db import MongoModel, PyObjectId


class CounterType(StrEnum):
    """Types of entities that use sequential numbering."""

    NOTE = "note"
    ATTACHMENT = "attachment"


class Counter(MongoModel):
    """Atomic counter for sequential numbers per space.

    Uses MongoDB atomic operations to prevent duplicates.
    Indexed on (space_id, counter_type) - unique.
    """

    space_id: PyObjectId
    counter_type: CounterType
    seq: int = 0  # Current value; next number will be seq + 1
