from typing import Any

from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core.core import Service
from spacenote.core.counter.models import CounterType


class CounterService(Service):
    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)
        self._collection = database.get_collection("counters")

    async def on_start(self) -> None:
        """Create indexes on startup."""
        # Unique compound index for space_id and counter_type
        await self._collection.create_index([("space_id", 1), ("counter_type", 1)], unique=True)

    async def get_next_sequence(self, space_id: ObjectId, counter_type: CounterType | str) -> int:
        """Atomically increment and return the next sequence number for a space and type."""
        result = await self._collection.find_one_and_update(
            {"space_id": space_id, "counter_type": counter_type},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=True,
        )

        # If it was just created (upserted), seq will be 1
        # Otherwise, it returns the incremented value
        return int(result["seq"])

    async def get_current_sequence(self, space_id: ObjectId, counter_type: CounterType | str) -> int:
        """Get the current sequence number without incrementing."""
        doc = await self._collection.find_one({"space_id": space_id, "counter_type": counter_type})
        if doc:
            return int(doc["seq"])
        return 0

    async def reset_sequence(self, space_id: ObjectId, counter_type: CounterType | str, value: int = 0) -> None:
        """Reset the sequence to a specific value (default 0)."""
        await self._collection.update_one(
            {"space_id": space_id, "counter_type": counter_type},
            {"$set": {"seq": value}},
            upsert=True,
        )
