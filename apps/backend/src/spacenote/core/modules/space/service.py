from typing import Any

import structlog
from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core.modules.space.models import Space
from spacenote.core.service import Service
from spacenote.errors import NotFoundError, ValidationError

logger = structlog.get_logger(__name__)


class SpaceService(Service):
    """Manages spaces with in-memory cache."""

    COLLECTION_NAME = "spaces"

    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)
        self._collection = database.get_collection(self.COLLECTION_NAME)
        self._spaces: dict[str, Space] = {}

    def get_space(self, slug: str) -> Space:
        """Get space by slug from cache."""
        if slug not in self._spaces:
            raise NotFoundError(f"Space '{slug}' not found")
        return self._spaces[slug]

    def has_space(self, slug: str) -> bool:
        """Check if space exists by slug."""
        return slug in self._spaces

    def get_all_spaces(self) -> list[Space]:
        """Get all spaces from cache."""
        return list(self._spaces.values())

    def get_user_spaces(self, username: str) -> list[Space]:
        """Get spaces where user is a member."""
        return [space for space in self._spaces.values() if username in space.members]

    async def create_space(self, slug: str, title: str, description: str, members: list[str]) -> Space:
        """Create new space."""
        if self.has_space(slug):
            raise ValidationError(f"Space '{slug}' already exists")

        self._validate_members(members)

        space = Space(slug=slug, title=title, description=description, members=members)
        await self._collection.insert_one(space.to_mongo())
        return await self.update_space_cache(slug)

    async def update_title(self, slug: str, title: str) -> Space:
        """Update space title."""
        self.get_space(slug)

        await self._collection.update_one({"slug": slug}, {"$set": {"title": title}})
        return await self.update_space_cache(slug)

    async def update_description(self, slug: str, description: str) -> Space:
        """Update space description."""
        self.get_space(slug)

        await self._collection.update_one({"slug": slug}, {"$set": {"description": description}})
        return await self.update_space_cache(slug)

    async def update_members(self, slug: str, members: list[str]) -> Space:
        """Update space members."""
        self.get_space(slug)
        self._validate_members(members)

        await self._collection.update_one({"slug": slug}, {"$set": {"members": members}})
        return await self.update_space_cache(slug)

    async def delete_space(self, slug: str) -> None:
        """Delete a space and all related data."""
        if not self.has_space(slug):
            raise NotFoundError(f"Space '{slug}' not found")

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
