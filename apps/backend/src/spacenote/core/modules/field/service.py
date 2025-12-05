import structlog

from spacenote.core.modules.field.models import FieldValueType, SpaceField
from spacenote.core.modules.field.validators import VALIDATORS, ParseContext
from spacenote.core.service import Service
from spacenote.errors import NotFoundError, ValidationError

logger = structlog.get_logger(__name__)


class FieldService(Service):
    """Service for field management."""

    async def add_field(self, slug: str, field: SpaceField) -> SpaceField:
        """Add a field to a space. Returns the validated field."""
        space = self.core.services.space.get_space(slug)

        if any(f.name == field.name for f in space.fields):
            raise ValidationError(f"Field '{field.name}' already exists in space")

        validator_class = VALIDATORS.get(field.type)
        if not validator_class:
            raise ValidationError(f"Unknown field type: {field.type}")

        validated_field = validator_class.validate_field(field, space)

        await self.core.services.space.update_space_document(slug, {"$push": {"fields": validated_field.model_dump()}})
        logger.debug("field_added_to_space", space_slug=slug, field_name=validated_field.name)
        return validated_field

    async def remove_field(self, slug: str, field_name: str) -> None:
        """Remove a field from a space."""
        space = self.core.services.space.get_space(slug)

        if not any(f.name == field_name for f in space.fields):
            raise NotFoundError(f"Field '{field_name}' not found in space")

        await self.core.services.space.update_space_document(slug, {"$pull": {"fields": {"name": field_name}}})
        logger.debug("field_removed_from_space", space_slug=slug, field_name=field_name)

    def parse_raw_fields(
        self,
        space_slug: str,
        raw_fields: dict[str, str],
        current_user: str | None = None,
        partial: bool = False,
    ) -> dict[str, FieldValueType]:
        """Parse raw string field values to typed values.

        Args:
            space_slug: The space slug to get field definitions
            raw_fields: Dictionary of field names to raw string values
            current_user: Current user for $me substitution
            partial: If True, only validate provided fields (for partial updates)

        Returns:
            Dictionary of field names to parsed typed values
        """
        space = self.core.services.space.get_space(space_slug)
        ctx = ParseContext(current_user=current_user)
        parsed: dict[str, FieldValueType] = {}

        # Check for unknown fields first
        for field_name in raw_fields:
            if space.get_field(field_name) is None:
                raise ValidationError(f"Unknown field: {field_name}")

        if partial:
            # For updates: only parse provided fields
            for field_name, raw_value in raw_fields.items():
                field = space.get_field(field_name)
                if field is not None:
                    validator_class = VALIDATORS.get(field.type)
                    if not validator_class:
                        raise ValidationError(f"Unknown field type: {field.type}")
                    parsed[field.name] = validator_class.parse_value(field, space, raw_value, ctx)
        else:
            # For creation: parse all fields (provided and missing)
            for field in space.fields:
                validator_class = VALIDATORS.get(field.type)
                if not validator_class:
                    raise ValidationError(f"Unknown field type: {field.type}")
                parsed[field.name] = validator_class.parse_value(field, space, raw_fields.get(field.name), ctx)

        return parsed
