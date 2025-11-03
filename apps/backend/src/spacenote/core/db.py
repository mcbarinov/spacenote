from typing import Any, Self

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, GetCoreSchemaHandler
from pydantic_core import core_schema
from pymongo.asynchronous.cursor import AsyncCursor


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic v2 integration."""

    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        _source_type: object,
        _handler: GetCoreSchemaHandler,
    ) -> core_schema.CoreSchema:
        """Provide Pydantic v2 core schema for ObjectId validation and serialization."""
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema(
                [
                    core_schema.is_instance_schema(ObjectId),
                    core_schema.chain_schema(
                        [
                            core_schema.str_schema(),
                            core_schema.no_info_plain_validator_function(cls.validate),
                        ]
                    ),
                ]
            ),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x),
            ),
        )

    @classmethod
    def validate(cls, v: object) -> ObjectId:
        """Validate and convert value to ObjectId."""
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError(f"Invalid ObjectId: {v}")


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
