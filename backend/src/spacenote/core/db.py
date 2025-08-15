from typing import Any, Self

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field
from pymongo.asynchronous.cursor import AsyncCursor


class MongoModel(BaseModel):
    id: ObjectId = Field(alias="_id", serialization_alias="id", default_factory=ObjectId)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    def to_mongo_dict(self) -> dict[str, Any]:
        """Convert the model to a dictionary for MongoDB storage with _id field."""
        data = self.model_dump()
        if "id" in data:
            data["_id"] = data.pop("id")  # Rename id → _id for MongoDB
        return data

    @classmethod
    async def list_cursor(cls, cursor: AsyncCursor[dict[str, Any]]) -> list[Self]:
        """Iterate over an AsyncCursor and return a list of model instances."""
        return [cls.model_validate(item) async for item in cursor]
