from typing import Any

import structlog
from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core import utils
from spacenote.core.core import Service
from spacenote.core.errors import NotFoundError, ValidationError
from spacenote.core.field.models import SpaceField
from spacenote.core.field.validators import validate_space_field
from spacenote.core.space.models import Space

logger = structlog.get_logger(__name__)


class SpaceService(Service):
    """Service for managing spaces with in-memory caching."""

    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)
        self._collection = database.get_collection("spaces")
        self._spaces: dict[ObjectId, Space] = {}

    async def on_start(self) -> None:
        await self._collection.create_index([("slug", 1)], unique=True)
        await self.update_all_spaces_cache()
        logger.debug("space_service_started", space_count=len(self._spaces))

    async def update_all_spaces_cache(self) -> None:
        """Reload all spaces cache from database."""
        spaces = await Space.list_cursor(self._collection.find())
        self._spaces = {space.id: space for space in spaces}

    async def update_space_cache(self, id: ObjectId) -> Space:
        """Reload a specific space cache from database."""
        space = await self._collection.find_one({"_id": id})
        if space is None:
            raise NotFoundError(f"Space '{id}' not found")
        self._spaces[id] = Space.model_validate(space)
        return self._spaces[id]

    def get_space(self, space_id: ObjectId) -> Space:
        """Get a space by ID."""
        if space_id not in self._spaces:
            raise NotFoundError(f"Space '{space_id}' not found")
        return self._spaces[space_id]

    def get_space_by_slug(self, slug: str) -> Space:
        """Get a space by slug."""
        for space in self._spaces.values():
            if space.slug == slug:
                return space
        raise NotFoundError(f"Space with slug '{slug}' not found")

    def get_spaces_by_member(self, member: ObjectId) -> list[Space]:
        """Get all spaces where the user is a member."""
        return [space for space in self._spaces.values() if member in space.members]

    def has_slug(self, slug: str) -> bool:
        """Check if a space exists by slug."""
        return any(space.slug == slug for space in self._spaces.values())

    async def create_space(self, slug: str, title: str, member: ObjectId) -> Space:
        """Create a new space with validation."""
        if not self.core.services.user.has_user(member):
            raise ValidationError(f"User '{member}' does not exist")
        if not utils.is_slug(slug):
            raise ValidationError(f"Invalid slug format: '{slug}'")
        if self.has_slug(slug):
            raise ValidationError(f"Space with slug '{slug}' already exists")

        res = await self._collection.insert_one(Space(slug=slug, title=title, members=[member]).to_mongo())
        return await self.update_space_cache(res.inserted_id)

    async def add_field(self, space_id: ObjectId, field: SpaceField) -> Space:
        """Add a field to a space with validation."""
        space = self.get_space(space_id)
        if space.get_field(field.name) is not None:
            raise ValidationError(f"Field '{field.name}' already exists in space")

        validated_field = validate_space_field(field)
        await self._collection.update_one({"_id": space_id}, {"$push": {"fields": validated_field.model_dump()}})

        return await self.update_space_cache(space_id)

    async def update_members(self, space_id: ObjectId, member_ids: list[ObjectId]) -> Space:
        """Update space members with provided user IDs."""
        # Validate that all user IDs exist
        for member_id in member_ids:
            if not self.core.services.user.has_user(member_id):
                raise ValidationError(f"User with ID '{member_id}' does not exist")

        # Update members in database
        await self._collection.update_one({"_id": space_id}, {"$set": {"members": member_ids}})

        return await self.update_space_cache(space_id)

    async def update_title(self, space_id: ObjectId, title: str) -> Space:
        """Update space title."""
        if not title or not title.strip():
            raise ValidationError("Title cannot be empty")

        await self._collection.update_one({"_id": space_id}, {"$set": {"title": title.strip()}})
        return await self.update_space_cache(space_id)

    async def update_list_fields(self, space_id: ObjectId, list_fields: list[str]) -> Space:
        """Update space list fields."""
        space = self.get_space(space_id)

        # Validate that all field names exist in the space
        field_names = {field.name for field in space.fields}
        for field_name in list_fields:
            if field_name not in field_names:
                raise ValidationError(f"Field '{field_name}' does not exist in the space")

        await self._collection.update_one({"_id": space_id}, {"$set": {"list_fields": list_fields}})
        return await self.update_space_cache(space_id)

    async def update_hidden_create_fields(self, space_id: ObjectId, hidden_create_fields: list[str]) -> Space:
        """Update space hidden create fields."""
        space = self.get_space(space_id)

        # Validate that all field names exist in the space
        field_names = {field.name for field in space.fields}
        for field_name in hidden_create_fields:
            if field_name not in field_names:
                raise ValidationError(f"Field '{field_name}' does not exist in the space")

        await self._collection.update_one({"_id": space_id}, {"$set": {"hidden_create_fields": hidden_create_fields}})
        return await self.update_space_cache(space_id)
