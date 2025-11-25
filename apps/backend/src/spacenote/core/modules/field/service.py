from typing import Any

import structlog
from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core.modules.field.models import SpaceField
from spacenote.core.modules.field.validators import VALIDATORS
from spacenote.core.service import Service
from spacenote.errors import NotFoundError, ValidationError

logger = structlog.get_logger(__name__)


class FieldService(Service):
    """Service for field management."""

    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)

    async def add_field_to_space(self, slug: str, field: SpaceField) -> None:
        """Add a field to a space.

        Args:
            slug: The space slug
            field: Field definition to add to the space

        Raises:
            ValidationError: If field with this name already exists or invalid
            NotFoundError: If space not found
        """
        space = self.core.services.space.get_space(slug)

        if any(f.name == field.name for f in space.fields):
            raise ValidationError(f"Field '{field.name}' already exists in space")

        validator_class = VALIDATORS.get(field.type)
        if not validator_class:
            raise ValidationError(f"Unknown field type: {field.type}")

        validated_field = validator_class.validate_definition(field, space)

        spaces_collection = self.database["spaces"]
        await spaces_collection.update_one({"slug": slug}, {"$push": {"fields": validated_field.model_dump()}})
        await self.core.services.space.update_space_cache(slug)
        logger.debug("field_added_to_space", space_slug=slug, field_name=validated_field.name)

    async def remove_field_from_space(self, slug: str, field_name: str) -> None:
        """Remove a field from a space.

        Args:
            slug: The space slug
            field_name: The name of the field to remove

        Raises:
            NotFoundError: If space or field not found
        """
        space = self.core.services.space.get_space(slug)

        if not any(f.name == field_name for f in space.fields):
            raise NotFoundError(f"Field '{field_name}' not found in space")

        spaces_collection = self.database["spaces"]
        await spaces_collection.update_one({"slug": slug}, {"$pull": {"fields": {"name": field_name}}})
        await self.core.services.space.update_space_cache(slug)
        logger.debug("field_removed_from_space", space_slug=slug, field_name=field_name)
