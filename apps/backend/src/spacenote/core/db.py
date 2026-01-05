from enum import StrEnum
from typing import Any, Self

from bson import ObjectId
from pydantic import ConfigDict, Field, GetCoreSchemaHandler
from pydantic_core import core_schema
from pymongo.asynchronous.cursor import AsyncCursor

from spacenote.core.schema import OpenAPIModel


class Collection(StrEnum):
    """MongoDB collection names."""

    USERS = "users"
    SESSIONS = "sessions"
    SPACES = "spaces"
    NOTES = "notes"
    COMMENTS = "comments"
    COUNTERS = "counters"
    PENDING_ATTACHMENTS = "pending_attachments"
    ATTACHMENTS = "attachments"
    TELEGRAM_TASKS = "telegram_tasks"
    TELEGRAM_MIRRORS = "telegram_mirrors"


class PyObjectId(ObjectId):
    """MongoDB ObjectId with Pydantic v2 support."""

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: object, handler: GetCoreSchemaHandler) -> core_schema.CoreSchema:
        """Generate Pydantic core schema for ObjectId validation."""

        def validate_object_id(value: object) -> ObjectId:
            if isinstance(value, ObjectId):
                return value
            if isinstance(value, str):
                if ObjectId.is_valid(value):
                    return ObjectId(value)
                raise ValueError(f"Invalid ObjectId string: {value}")
            if isinstance(value, bytes):
                return ObjectId(value)
            raise ValueError(f"Expected ObjectId, str or bytes, got {type(value).__name__}")

        return core_schema.no_info_plain_validator_function(validate_object_id)


class MongoModel(OpenAPIModel):
    """Base model for MongoDB documents using ObjectId as primary key."""

    id: PyObjectId = Field(alias="_id", default_factory=PyObjectId, exclude=True)
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    def to_mongo(self) -> dict[str, Any]:
        """Convert the model to a dictionary for MongoDB storage with _id field."""
        data = self.model_dump()
        data["_id"] = self.id
        return data

    @classmethod
    async def list_cursor(cls, cursor: AsyncCursor[dict[str, Any]]) -> list[Self]:
        """Iterate over an AsyncCursor and return a list of model instances."""
        return [cls.model_validate(item) async for item in cursor]
