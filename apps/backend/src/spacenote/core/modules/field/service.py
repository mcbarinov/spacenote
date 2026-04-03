import contextlib
from typing import Any

import structlog

from spacenote.core.modules.attachment.models import PendingAttachment
from spacenote.core.modules.field.models import FIELD_TYPE_OPTIONS, FieldType, FieldValueType, SpaceField
from spacenote.core.modules.field.validators import VALIDATORS, DateTimeValidator, ParseContext
from spacenote.core.modules.space.models import Space
from spacenote.core.service import Service
from spacenote.errors import NotFoundError, ValidationError

logger = structlog.get_logger(__name__)


class FieldService(Service):
    """Service for field management."""

    async def add_field(self, slug: str, field: SpaceField) -> SpaceField:
        """Add a field to a space. Returns the validated field."""
        # Resolved space has own + inherited fields — one check catches both own and parent collisions
        space = self.core.services.space.get_space(slug)
        space_doc = self.core.services.space.get_space_document(slug)

        if any(f.name == field.name for f in space.fields):
            raise ValidationError(f"Field '{field.name}' already exists in space")

        # If this is a parent space, also ensure no child already has a field with this name
        if space_doc.parent is None:
            for child_slug in self.core.services.space.get_child_slugs(slug):
                child = self.core.services.space.get_space_document(child_slug)
                if any(f.name == field.name for f in child.fields):
                    raise ValidationError(f"Field '{field.name}' already exists in child space '{child_slug}'")

        validator_class = VALIDATORS.get(field.type)
        if not validator_class:
            raise ValidationError(f"Unknown field type: {field.type}")

        validated_field = validator_class.validate_field(field, space)

        await self.core.services.space.update_space_document(slug, {"$push": {"fields": validated_field.model_dump()}})
        logger.debug("field_added_to_space", space_slug=slug, field_name=validated_field.name)
        return validated_field

    async def remove_field(self, slug: str, field_name: str) -> None:
        """Remove a field from a space. Only own fields can be removed, not inherited ones."""
        space_doc = self.core.services.space.get_space_document(slug)

        if not any(f.name == field_name for f in space_doc.fields):
            # Field not found in own config — check if it exists in resolved (inherited from parent)
            resolved = self.core.services.space.get_space(slug)
            if any(f.name == field_name for f in resolved.fields):
                raise ValidationError(f"Field '{field_name}' is inherited from parent and cannot be removed")
            raise NotFoundError(f"Field '{field_name}' not found in space")

        await self.core.services.space.update_space_document(slug, {"$pull": {"fields": {"name": field_name}}})
        logger.debug("field_removed_from_space", space_slug=slug, field_name=field_name)

    async def update_field(
        self,
        slug: str,
        field_name: str,
        required: bool,
        options: dict[str, Any],
        default: FieldValueType,
    ) -> SpaceField:
        """Update a field in a space. Only required, options, and default can be changed."""
        # Resolved space for validator context, own space to check field ownership
        space = self.core.services.space.get_space(slug)
        space_doc = self.core.services.space.get_space_document(slug)

        # Only own fields can be updated — inherited fields must be changed in the parent space
        existing_field = next((f for f in space_doc.fields if f.name == field_name), None)
        if not existing_field:
            # Field not in own config — check if it exists in resolved (inherited from parent)
            resolved_field = space.get_field(field_name)
            if resolved_field:
                raise ValidationError(f"Field '{field_name}' is inherited from parent and cannot be updated")
            raise NotFoundError(f"Field '{field_name}' not found in space")

        # Create updated field preserving name and type
        options_class = FIELD_TYPE_OPTIONS[existing_field.type]
        typed_options = options_class(**options)
        updated_field = SpaceField(
            name=existing_field.name,
            type=existing_field.type,
            required=required,
            options=typed_options,
            default=default,
        )

        # Validate using existing validators
        validator_class = VALIDATORS.get(updated_field.type)
        if not validator_class:
            raise ValidationError(f"Unknown field type: {updated_field.type}")

        validated_field = validator_class.validate_field(updated_field, space)

        # Update in MongoDB using array_filters pattern
        await self.core.services.space.update_space_document(
            slug,
            {"$set": {"fields.$[elem]": validated_field.model_dump()}},
            array_filters=[{"elem.name": field_name}],
        )

        logger.debug("field_updated", space_slug=slug, field_name=field_name)
        return validated_field

    async def parse_raw_fields(
        self,
        space_slug: str,
        raw_fields: dict[str, str],
        current_fields: dict[str, FieldValueType] | None = None,
        current_user: str | None = None,
        partial: bool = False,
    ) -> dict[str, FieldValueType]:
        """Parse raw string field values to typed values.

        Args:
            space_slug: Space containing the field schema.
            raw_fields: User-provided string values from API request, keyed by field name.
            current_fields: Note's field values before this update. Needed by recurrence
                validator to preserve interval on $done/$reset. None on create.
            current_user: Username for $me substitution in USER fields.
            partial: If True, only parse fields present in raw_fields (update mode).
                If False, parse all space fields, applying defaults for missing ones (create mode).
        """
        space = self.core.services.space.get_space(space_slug)
        pending_attachments = await self._load_pending_attachments(space, raw_fields)
        ctx = ParseContext(
            current_user=current_user,
            raw_fields=raw_fields,
            pending_attachments=pending_attachments,
            current_fields=current_fields,
        )
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

    async def _load_pending_attachments(self, space: Space, raw_fields: dict[str, str]) -> list[PendingAttachment]:
        """Load pending attachments needed for field value parsing."""
        pending_numbers: set[int] = set()

        # DATETIME fields with $exif.created_at:{field} default need the referenced image's EXIF data
        for field in space.fields:
            if field.type != FieldType.DATETIME:
                continue
            image_field = DateTimeValidator.get_exif_source_field(field.default)
            if not image_field:
                continue
            raw_value = raw_fields.get(image_field)
            if raw_value:
                with contextlib.suppress(ValueError):
                    pending_numbers.add(int(raw_value))

        result: list[PendingAttachment] = []
        for num in pending_numbers:
            with contextlib.suppress(NotFoundError):
                result.append(await self.core.services.attachment.get_pending_attachment(num))

        return result
