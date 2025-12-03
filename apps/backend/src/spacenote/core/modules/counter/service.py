from functools import cached_property
from typing import Any

from pymongo import ReturnDocument
from pymongo.asynchronous.collection import AsyncCollection

from spacenote.core.db import Collection
from spacenote.core.modules.counter.models import CounterType
from spacenote.core.service import Service


class CounterService(Service):
    """Service for managing auto-incrementing counters per space."""

    @cached_property
    def _collection(self) -> AsyncCollection[dict[str, Any]]:
        return self.database.get_collection(Collection.COUNTERS)

    async def on_start(self) -> None:
        """Create indexes on startup."""
        await self._collection.create_index([("space_slug", 1), ("counter_type", 1), ("note_number", 1)], unique=True)

    async def get_next_sequence(self, space_slug: str, counter_type: CounterType, note_number: int | None = None) -> int:
        """Atomically increment and return the next sequence number."""
        result = await self._collection.find_one_and_update(
            {"space_slug": space_slug, "counter_type": counter_type, "note_number": note_number},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return int(result["seq"])

    async def delete_counters_by_space(self, space_slug: str) -> int:
        """Delete all counters for a space."""
        result = await self._collection.delete_many({"space_slug": space_slug})
        return result.deleted_count

    async def delete_counters_by_note(self, space_slug: str, note_number: int) -> int:
        """Delete all counters for a note (e.g., comment counters)."""
        result = await self._collection.delete_many({"space_slug": space_slug, "note_number": note_number})
        return result.deleted_count

    async def set_sequence(self, space_slug: str, counter_type: CounterType, value: int, note_number: int | None = None) -> None:
        """Set counter sequence to specific value (for import)."""
        await self._collection.update_one(
            {"space_slug": space_slug, "counter_type": counter_type, "note_number": note_number},
            {"$set": {"seq": value}},
            upsert=True,
        )
