from enum import StrEnum

from spacenote.core.db import MongoModel


class CounterType(StrEnum):
    """Types of entities that use sequential numbering."""

    NOTE = "note"


class Counter(MongoModel):
    """Atomic counter for sequential numbers per space."""

    space_slug: str
    counter_type: CounterType
    seq: int = 0
