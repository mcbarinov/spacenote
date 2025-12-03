from typing import Any

import structlog

from spacenote.core.modules.filter import query_builder
from spacenote.core.modules.filter.models import ALL_FILTER_NAME, Filter
from spacenote.core.modules.filter.validators import validate_filter
from spacenote.core.service import Service
from spacenote.errors import NotFoundError, ValidationError

logger = structlog.get_logger(__name__)


class FilterService(Service):
    """Service for filter management."""

    async def add_filter(self, slug: str, filter: Filter) -> Filter:
        """Add a filter to a space."""
        space = self.core.services.space.get_space(slug)

        if any(f.name == filter.name for f in space.filters):
            raise ValidationError(f"Filter '{filter.name}' already exists in space")

        validated_filter = validate_filter(space, filter)

        await self.core.services.space.update_space_document(slug, {"$push": {"filters": validated_filter.model_dump()}})
        logger.debug("filter_added_to_space", space_slug=slug, filter_name=filter.name)
        return validated_filter

    async def remove_filter(self, slug: str, filter_name: str) -> None:
        """Remove a filter from a space."""
        if filter_name == ALL_FILTER_NAME:
            raise ValidationError(f"Cannot delete the '{ALL_FILTER_NAME}' filter")

        space = self.core.services.space.get_space(slug)

        if not any(f.name == filter_name for f in space.filters):
            raise NotFoundError(f"Filter '{filter_name}' not found in space")

        await self.core.services.space.update_space_document(slug, {"$pull": {"filters": {"name": filter_name}}})
        logger.debug("filter_removed_from_space", space_slug=slug, filter_name=filter_name)

    def build_query(self, space_slug: str, filter_name: str, current_user: str) -> tuple[dict[str, Any], list[tuple[str, int]]]:
        """Build MongoDB query and sort spec for a filter."""
        space = self.core.services.space.get_space(space_slug)
        filter_def = space.get_filter(filter_name)
        if not filter_def:
            raise NotFoundError(f"Filter '{filter_name}' not found")
        query = query_builder.build_mongo_query(filter_def.conditions, space_slug, current_user)
        sort_spec = query_builder.build_mongo_sort(filter_def.sort)
        return query, sort_spec
