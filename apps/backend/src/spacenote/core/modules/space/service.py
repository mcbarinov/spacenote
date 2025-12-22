from functools import cached_property
from typing import Any

import structlog
from pymongo.asynchronous.collection import AsyncCollection

from spacenote.core.db import Collection
from spacenote.core.modules.filter.models import ALL_FILTER_NAME, create_default_all_filter
from spacenote.core.modules.space.models import Space
from spacenote.core.service import Service
from spacenote.errors import NotFoundError, ValidationError

logger = structlog.get_logger(__name__)


class SpaceService(Service):
    """Manages spaces with in-memory cache."""

    def __init__(self) -> None:
        self._spaces: dict[str, Space] = {}

    @cached_property
    def _collection(self) -> AsyncCollection[dict[str, Any]]:
        return self.database.get_collection(Collection.SPACES)

    def get_space(self, slug: str) -> Space:
        """Get space by slug from cache."""
        if slug not in self._spaces:
            raise NotFoundError(f"Space '{slug}' not found")
        return self._spaces[slug]

    def has_space(self, slug: str) -> bool:
        """Check if space exists by slug."""
        return slug in self._spaces

    def list_all_spaces(self) -> list[Space]:
        """List all spaces from cache."""
        return list(self._spaces.values())

    def list_user_spaces(self, username: str) -> list[Space]:
        """List spaces where user is a member."""
        return [space for space in self._spaces.values() if username in space.members]

    async def create_space(self, slug: str, title: str, description: str, members: list[str]) -> Space:
        """Create new space."""
        if self.has_space(slug):
            raise ValidationError(f"Space '{slug}' already exists")

        self._validate_members(members)

        space = Space(slug=slug, title=title, description=description, members=members, filters=[create_default_all_filter()])
        await self._collection.insert_one(space.to_mongo())
        return await self.update_space_cache(slug)

    async def import_space(self, space: Space) -> Space:
        """Insert pre-built space (for import)."""
        if self.has_space(space.slug):
            raise ValidationError(f"Space '{space.slug}' already exists")

        self._validate_members(space.members)

        # Ensure 'all' filter exists
        if not any(f.name == ALL_FILTER_NAME for f in space.filters):
            space.filters.insert(0, create_default_all_filter())

        await self._collection.insert_one(space.to_mongo())
        return await self.update_space_cache(space.slug)

    async def update_title(self, slug: str, title: str) -> Space:
        """Update space title."""
        self.get_space(slug)
        return await self.update_space_document(slug, {"$set": {"title": title}})

    async def update_description(self, slug: str, description: str) -> Space:
        """Update space description."""
        self.get_space(slug)
        return await self.update_space_document(slug, {"$set": {"description": description}})

    async def update_members(self, slug: str, members: list[str]) -> Space:
        """Update space members."""
        self.get_space(slug)
        self._validate_members(members)
        return await self.update_space_document(slug, {"$set": {"members": members}})

    async def update_hidden_fields_on_create(self, slug: str, field_names: list[str]) -> Space:
        """Update hidden fields on create list."""
        space = self.get_space(slug)

        # Validate field names exist and can be hidden (optional or has default)
        fields_by_name = {f.name: f for f in space.fields}
        for name in field_names:
            field = fields_by_name.get(name)
            if field is None:
                raise ValidationError(f"Field '{name}' not found in space fields")
            if field.required and field.default is None:
                raise ValidationError(f"Field '{name}' is required and has no default value, cannot be hidden")

        return await self.update_space_document(slug, {"$set": {"hidden_fields_on_create": field_names}})

    async def update_editable_fields_on_comment(self, slug: str, field_names: list[str]) -> Space:
        """Update editable fields on comment list."""
        space = self.get_space(slug)

        # Validate field names exist
        fields_by_name = {f.name: f for f in space.fields}
        for name in field_names:
            if name not in fields_by_name:
                raise ValidationError(f"Field '{name}' not found in space fields")

        return await self.update_space_document(slug, {"$set": {"editable_fields_on_comment": field_names}})

    async def update_default_filter(self, slug: str, default_filter: str) -> Space:
        """Update default filter for the space."""
        space = self.get_space(slug)

        if not space.get_filter(default_filter):
            raise ValidationError(f"Filter '{default_filter}' not found in space")

        return await self.update_space_document(slug, {"$set": {"default_filter": default_filter}})

    async def update_space_document(
        self, slug: str, update: dict[str, Any], array_filters: list[dict[str, Any]] | None = None
    ) -> Space:
        """Low-level MongoDB update with automatic cache invalidation.

        Used internally by SpaceService update methods and by external feature services
        (FieldService, FilterService, etc.) that need to modify Space document.

        Caller is responsible for validating space exists (call get_space() first)
        and validating all data in the update operation.
        """
        await self._collection.update_one({"slug": slug}, update, array_filters=array_filters)
        return await self.update_space_cache(slug)

    async def delete_space(self, slug: str) -> None:
        """Delete a space and all related data."""
        if not self.has_space(slug):
            raise NotFoundError(f"Space '{slug}' not found")

        await self.core.services.telegram.delete_telegram_tasks_by_space(slug)
        await self.core.services.telegram.delete_telegram_mirrors_by_space(slug)
        await self.core.services.attachment.delete_attachments_by_space(slug)
        self.core.services.image.delete_images_by_space(slug)
        await self.core.services.comment.delete_comments_by_space(slug)
        await self.core.services.note.delete_notes_by_space(slug)
        await self.core.services.counter.delete_counters_by_space(slug)
        await self._collection.delete_one({"slug": slug})
        del self._spaces[slug]

    def _validate_members(self, members: list[str]) -> None:
        """Validate that all members exist in user cache."""
        for username in members:
            if not self.core.services.user.has_user(username):
                raise ValidationError(f"User '{username}' not found")
            if username == "admin":
                raise ValidationError("Admin user cannot be a member of spaces")

    async def update_all_spaces_cache(self) -> None:
        """Reload all spaces cache from database."""
        spaces = await Space.list_cursor(self._collection.find())
        self._spaces = {space.slug: space for space in spaces}

    async def update_space_cache(self, slug: str) -> Space:
        """Reload a specific space cache from database."""
        space = await self._collection.find_one({"slug": slug})
        if space is None:
            raise NotFoundError(f"Space '{slug}' not found")
        self._spaces[slug] = Space.model_validate(space)
        return self._spaces[slug]

    async def on_start(self) -> None:
        """Initialize indexes and cache."""
        await self._collection.create_index([("slug", 1)], unique=True)
        await self.update_all_spaces_cache()
        logger.debug("space_service_started", space_count=len(self._spaces))
