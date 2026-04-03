from typing import Any

import structlog

from spacenote.core.modules.filter import query_builder
from spacenote.core.modules.filter.adhoc import parse_adhoc_query
from spacenote.core.modules.filter.models import ALL_FILTER_NAME, Filter
from spacenote.core.modules.filter.validators import validate_filter
from spacenote.core.service import Service
from spacenote.errors import NotFoundError, ValidationError

logger = structlog.get_logger(__name__)


class FilterService(Service):
    """Service for filter management."""

    async def add_filter(self, slug: str, filter: Filter) -> Filter:
        """Add a filter to a space."""
        # Resolved space for validation (has full field list including inherited)
        space = self.core.services.space.get_space(slug)
        space_doc = self.core.services.space.get_space_document(slug)

        # Only check own filters for duplicates — adding a filter with the same name
        # as a parent's filter is allowed (creates an override in the resolved view)
        if any(f.name == filter.name for f in space_doc.filters):
            raise ValidationError(f"Filter '{filter.name}' already exists in space")

        validated_filter = validate_filter(space, filter)

        await self.core.services.space.update_space_document(slug, {"$push": {"filters": validated_filter.model_dump()}})
        logger.debug("filter_added_to_space", space_slug=slug, filter_name=filter.name)
        return validated_filter

    async def remove_filter(self, slug: str, filter_name: str) -> None:
        """Remove a filter from a space. Only own filters can be removed."""
        if filter_name == ALL_FILTER_NAME:
            raise ValidationError(f"Cannot delete the '{ALL_FILTER_NAME}' filter")

        space_doc = self.core.services.space.get_space_document(slug)

        # Only own filters can be removed — inherited filters live in the parent space
        if not any(f.name == filter_name for f in space_doc.filters):
            # Filter not in own config — check if it exists in resolved (inherited from parent)
            resolved = self.core.services.space.get_space(slug)
            if any(f.name == filter_name for f in resolved.filters):
                raise ValidationError(f"Filter '{filter_name}' is inherited from parent and cannot be removed")
            raise NotFoundError(f"Filter '{filter_name}' not found in space")

        await self.core.services.space.update_space_document(slug, {"$pull": {"filters": {"name": filter_name}}})

        # Reset default_filter to "all" if deleting the current default
        if space_doc.default_filter == filter_name:
            await self.core.services.space.update_space_document(slug, {"$set": {"default_filter": ALL_FILTER_NAME}})

        # Remove associated template if it exists (only own templates)
        template_key = f"web:note:list:{filter_name}"
        if template_key in space_doc.templates:
            await self.core.services.space.update_space_document(
                slug,
                {"$unset": {f"templates.{template_key}": ""}},
            )

        logger.debug("filter_removed_from_space", space_slug=slug, filter_name=filter_name)

    async def update_filter(self, slug: str, filter_name: str, new_filter: Filter) -> Filter:
        """Update a filter in a space. Only own filters can be updated."""
        space = self.core.services.space.get_space(slug)
        space_doc = self.core.services.space.get_space_document(slug)

        # Only own filters can be updated — inherited filters must be changed in the parent space
        if not any(f.name == filter_name for f in space_doc.filters):
            # Filter not in own config — check if it exists in resolved (inherited from parent)
            if space.get_filter(filter_name):
                raise ValidationError(f"Filter '{filter_name}' is inherited from parent and cannot be updated")
            raise NotFoundError(f"Filter '{filter_name}' not found in space")

        if filter_name == ALL_FILTER_NAME:
            if new_filter.name != ALL_FILTER_NAME:
                raise ValidationError(f"Cannot rename the '{ALL_FILTER_NAME}' filter")
            if new_filter.conditions:
                raise ValidationError(f"Cannot modify conditions of the '{ALL_FILTER_NAME}' filter")

        validated_filter = validate_filter(space, new_filter)

        if validated_filter.name != filter_name and any(f.name == validated_filter.name for f in space_doc.filters):
            raise ValidationError(f"Filter '{validated_filter.name}' already exists in space")

        await self.core.services.space.update_space_document(
            slug,
            {"$set": {"filters.$[elem]": validated_filter.model_dump()}},
            array_filters=[{"elem.name": filter_name}],
        )

        # Rename associated template if filter was renamed
        if validated_filter.name != filter_name:
            old_key = f"web:note:list:{filter_name}"
            new_key = f"web:note:list:{validated_filter.name}"
            if old_key in space_doc.templates:
                await self.core.services.space.update_space_document(
                    slug,
                    {"$rename": {f"templates.{old_key}": f"templates.{new_key}"}},
                )

        logger.debug("filter_updated", space_slug=slug, filter_name=filter_name, new_name=validated_filter.name)
        return validated_filter

    def build_query(
        self, space_slug: str, filter_name: str, current_user: str, adhoc_query: str | None = None
    ) -> tuple[dict[str, Any], list[tuple[str, int]]]:
        """Build MongoDB query and sort spec for a filter."""
        space = self.core.services.space.get_space(space_slug)
        filter_def = space.get_filter(filter_name)
        if not filter_def:
            raise NotFoundError(f"Filter '{filter_name}' not found")

        # Combine saved filter conditions with adhoc conditions
        conditions = list(filter_def.conditions)
        if adhoc_query:
            adhoc_conditions = parse_adhoc_query(adhoc_query, space)
            conditions.extend(adhoc_conditions)

        query = query_builder.build_mongo_query(conditions, space_slug, current_user)
        sort_spec = query_builder.build_mongo_sort(filter_def.sort)
        return query, sort_spec
