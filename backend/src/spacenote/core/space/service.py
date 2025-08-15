from typing import Any

import structlog
from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core import utils
from spacenote.core.core import Service
from spacenote.core.errors import NotFoundError, ValidationError
from spacenote.core.space.models import Space

logger = structlog.get_logger(__name__)


class SpaceService(Service):
    """Service for managing spaces with in-memory caching."""

    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)
        self._collection = database.get_collection("spaces")
        self._spaces: dict[ObjectId, Space] = {}

    async def on_start(self) -> None:
        await self.update_cache()
        logger.debug("space_service_started", space_count=len(self._spaces))

    async def update_cache(self, id: ObjectId | None = None) -> None:
        """Reload spaces cache from database."""
        if id is not None:  # update a specific space
            space = await self._collection.find_one({"_id": id})
            if space is None:
                self._spaces.pop(id, None)  # Remove if exists, ignore if not
            else:
                self._spaces[id] = Space.model_validate(space)
        else:  # update all spaces
            spaces = await Space.list_cursor(self._collection.find())
            self._spaces = {space.id: space for space in spaces}

    def get_space(self, space_id: ObjectId) -> Space:
        """Get a space by ID."""
        if space_id not in self._spaces:
            raise NotFoundError(f"Space '{space_id}' not found")
        return self._spaces[space_id]

    def get_spaces_by_member(self, member: ObjectId) -> list[Space]:
        """Get all spaces where the user is a member."""
        return [space for space in self._spaces.values() if member in space.members]

    def has_slug(self, slug: str) -> bool:
        """Check if a space exists by slug."""
        return any(space.slug == slug for space in self._spaces.values())

    async def create_space(self, slug: str, title: str, member: ObjectId) -> Space:
        """Create a new space with validation."""
        log = logger.bind(slug=slug, member=member, action="create_space")
        log.debug("creating_space")

        if not self.core.services.user.has_user(member):
            log.warning("invalid_user_id")
            raise ValidationError(f"User '{member}' does not exist")

        if not utils.is_slug(slug):
            log.warning("invalid_slug_format")
            raise ValidationError(f"Invalid slug format: '{slug}'")

        id = (await self._collection.insert_one(Space(slug=slug, title=title, members=[member]).to_mongo_dict())).inserted_id
        await self.update_cache(id)

        log.debug("space_created")
        return self.get_space(id)
