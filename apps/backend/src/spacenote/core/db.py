from typing import Any, Self

from pydantic import BaseModel, ConfigDict
from pymongo.asynchronous.cursor import AsyncCursor


class MongoModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_serialization_defaults_required=True,
    )

    def to_mongo(self) -> dict[str, Any]:
        """Convert the model to a dictionary for MongoDB storage with _id field."""
        data = self.model_dump()
        if "id" in data:
            data["_id"] = data.pop("id")
        return data

    @classmethod
    async def list_cursor(cls, cursor: AsyncCursor[dict[str, Any]]) -> list[Self]:
        """Iterate over an AsyncCursor and return a list of model instances."""
        return [cls.model_validate(item) async for item in cursor]
