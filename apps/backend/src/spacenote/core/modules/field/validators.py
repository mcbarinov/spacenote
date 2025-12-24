"""Field validators for definition validation and value parsing."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation

from spacenote.core.modules.attachment.models import PendingAttachment
from spacenote.core.modules.field.models import (
    FieldType,
    FieldValueType,
    ImageFieldOptions,
    NumericFieldOptions,
    SelectFieldOptions,
    SpaceField,
    SpecialValue,
    StringFieldOptions,
)
from spacenote.core.modules.space.models import Space
from spacenote.errors import ValidationError


@dataclass
class ParseContext:
    """Context for parsing field values."""

    # Username of current user, used for $me substitution in USER fields
    current_user: str | None = None
    # Original raw string values from request, used to look up related field values (e.g. image field for $exif)
    raw_fields: dict[str, str] | None = None
    # Pending attachments loaded for parsing, used by DATETIME fields with $exif.created_at defaults
    pending_attachments: list[PendingAttachment] | None = None


class FieldValidator(ABC):
    """Base validator with template methods for definition validation and value parsing."""

    @classmethod
    def validate_field(cls, field: SpaceField, space: Space) -> SpaceField:
        """Validate field definition - checks name format and delegates to type-specific validation."""
        if not field.name or not field.name.replace("_", "").replace("-", "").isalnum():
            raise ValidationError(f"Invalid field name: {field.name}")

        return cls._validate_field(field, space)

    @classmethod
    def parse_value(cls, field: SpaceField, space: Space, raw: str | None, ctx: ParseContext) -> FieldValueType:
        """Parse raw string value to typed value."""
        return cls._parse_value(field, space, raw, ctx)

    @classmethod
    @abstractmethod
    def _validate_field(cls, field: SpaceField, space: Space) -> SpaceField:
        """Type-specific definition validation."""
        ...

    @classmethod
    @abstractmethod
    def _parse_value(cls, field: SpaceField, space: Space, raw: str | None, ctx: ParseContext) -> FieldValueType:
        """Type-specific value parsing."""
        ...


class StringValidator(FieldValidator):
    """Validator for string fields."""

    @classmethod
    def _validate_field(cls, field: SpaceField, _space: Space) -> SpaceField:
        if not isinstance(field.options, StringFieldOptions):
            raise ValidationError("STRING field options must be StringFieldOptions")
        return field

    @classmethod
    def _parse_value(cls, field: SpaceField, _space: Space, raw: str | None, _ctx: ParseContext) -> FieldValueType:
        if raw is None:
            if field.default is not None:
                return field.default
            if field.required:
                raise ValidationError(f"Required field '{field.name}' has no value")
            return None

        if raw == "" and not field.required:
            return None

        value = raw

        if isinstance(field.options, StringFieldOptions):
            if field.options.kind == "line" and "\n" in value:
                raise ValidationError(f"Field '{field.name}' does not allow newlines")

            if field.options.min_length is not None and len(value) < field.options.min_length:
                raise ValidationError(f"Field '{field.name}' value too short (min: {field.options.min_length})")

            if field.options.max_length is not None and len(value) > field.options.max_length:
                raise ValidationError(f"Field '{field.name}' value too long (max: {field.options.max_length})")

        return value


class BooleanValidator(FieldValidator):
    """Validator for boolean fields."""

    @classmethod
    def _validate_field(cls, field: SpaceField, _space: Space) -> SpaceField:
        if field.default is not None and not isinstance(field.default, bool):
            raise ValidationError("Boolean field default must be boolean")
        return field

    @classmethod
    def _parse_value(cls, field: SpaceField, _space: Space, raw: str | None, _ctx: ParseContext) -> FieldValueType:
        if raw is None:
            if field.default is not None:
                return field.default
            if field.required:
                raise ValidationError(f"Required field '{field.name}' has no value")
            return None

        if raw == "" and not field.required:
            return None

        if raw.lower() in ("true", "1", "yes", "on"):
            return True
        if raw.lower() in ("false", "0", "no", "off"):
            return False

        raise ValidationError(f"Invalid boolean value for field '{field.name}': {raw}")


class NumericValidator(FieldValidator):
    """Validator for numeric fields (int, float, decimal)."""

    @classmethod
    def _validate_field(cls, field: SpaceField, _space: Space) -> SpaceField:
        if not isinstance(field.options, NumericFieldOptions):
            raise ValidationError("NUMERIC field options must be NumericFieldOptions")

        if field.default is not None:
            cls._validate_default_type(field.name, field.default, field.options.kind)

        return field

    @classmethod
    def _validate_default_type(cls, field_name: str, default: FieldValueType, kind: str) -> None:
        """Validate default value matches the numeric kind."""
        if kind == "int" and not isinstance(default, int):
            raise ValidationError(f"Default value for int field '{field_name}' must be int")
        if kind == "float" and not isinstance(default, (int, float)):
            raise ValidationError(f"Default value for float field '{field_name}' must be numeric")
        if kind == "decimal" and not isinstance(default, (int, float, Decimal)):
            raise ValidationError(f"Default value for decimal field '{field_name}' must be numeric")

    @classmethod
    def _parse_value(cls, field: SpaceField, _space: Space, raw: str | None, _ctx: ParseContext) -> FieldValueType:
        if raw is None:
            if field.default is not None:
                if not isinstance(field.options, NumericFieldOptions):
                    raise ValidationError(
                        f"Invalid field configuration: NUMERIC field '{field.name}' options must be NumericFieldOptions"
                    )
                return cls._convert_default(field.default, field.options)
            if field.required:
                raise ValidationError(f"Required field '{field.name}' has no value")
            return None

        if raw == "" and not field.required:
            return None

        if not isinstance(field.options, NumericFieldOptions):
            raise ValidationError(
                f"Invalid field configuration: NUMERIC field '{field.name}' options must be NumericFieldOptions"
            )

        parsed_value: int | float | Decimal
        try:
            if field.options.kind == "int":
                parsed_value = int(raw)
            elif field.options.kind == "float":
                parsed_value = float(raw)
            elif field.options.kind == "decimal":
                parsed_value = Decimal(raw)
            else:
                raise ValidationError(f"Unknown numeric kind: {field.options.kind}")
        except (ValueError, InvalidOperation) as e:
            raise ValidationError(f"Invalid {field.options.kind} value for field '{field.name}': {raw}") from e

        cls._validate_numeric_range(field, parsed_value)
        return parsed_value

    @classmethod
    def _convert_default(cls, default: FieldValueType, options: NumericFieldOptions) -> int | float | Decimal:
        """Convert default value to appropriate type based on kind."""
        if options.kind == "int" and isinstance(default, int):
            return default
        if options.kind == "float" and isinstance(default, (int, float)):
            return float(default)
        if options.kind == "decimal":
            if isinstance(default, Decimal):
                return default
            if isinstance(default, (int, float)):
                return Decimal(str(default))
        raise ValidationError(f"Cannot convert default value to {options.kind}")

    @classmethod
    def _validate_numeric_range(cls, field: SpaceField, value: float | Decimal) -> None:
        """Validate numeric value is within min/max range."""
        if not isinstance(field.options, NumericFieldOptions):
            return

        comparable_value = float(value)

        if field.options.min is not None and comparable_value < field.options.min:
            raise ValidationError(f"Value for field '{field.name}' is below minimum: {value} < {field.options.min}")

        if field.options.max is not None and comparable_value > field.options.max:
            raise ValidationError(f"Value for field '{field.name}' is above maximum: {value} > {field.options.max}")


class SelectValidator(FieldValidator):
    """Validator for select fields."""

    @classmethod
    def _validate_field(cls, field: SpaceField, _space: Space) -> SpaceField:
        if not isinstance(field.options, SelectFieldOptions):
            raise ValidationError("SELECT field options must be SelectFieldOptions")

        if field.default and field.default not in field.options.values:
            raise ValidationError(f"Default value '{field.default}' is not in allowed values")

        return field

    @classmethod
    def _parse_value(cls, field: SpaceField, _space: Space, raw: str | None, _ctx: ParseContext) -> FieldValueType:
        if not isinstance(field.options, SelectFieldOptions):
            raise ValidationError("Invalid field configuration: SELECT field options must be SelectFieldOptions")

        if raw is None:
            if field.default is not None:
                return field.default
            if field.required:
                raise ValidationError(f"Required field '{field.name}' has no value")
            return None

        if raw == "" and not field.required:
            return None

        if raw not in field.options.values:
            raise ValidationError(f"Invalid choice for field '{field.name}': '{raw}'. Allowed: {', '.join(field.options.values)}")

        return raw


class TagsValidator(FieldValidator):
    """Validator for tags (multi-value) fields."""

    @classmethod
    def _validate_field(cls, field: SpaceField, _space: Space) -> SpaceField:
        return field

    @classmethod
    def _parse_value(cls, field: SpaceField, _space: Space, raw: str | None, _ctx: ParseContext) -> FieldValueType:
        if raw is None:
            if field.default is not None:
                return field.default
            if field.required:
                raise ValidationError(f"Required field '{field.name}' has no value")
            return None

        if raw == "" and not field.required:
            return None

        tags = [tag.strip() for tag in raw.split(",") if tag.strip()]
        return list(dict.fromkeys(tags))


class DateTimeValidator(FieldValidator):
    """Validator for datetime fields.

    Supports $exif.created_at:{image_field}|{fallback} default syntax
    to extract creation datetime from image EXIF metadata.
    """

    _DATETIME_FORMATS = [
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%SZ",
    ]

    @classmethod
    def _parse_datetime_string(cls, value: str) -> datetime | None:
        """Parse datetime string using supported formats. Returns None if invalid."""
        for fmt in cls._DATETIME_FORMATS:
            try:
                return datetime.strptime(value, fmt).replace(tzinfo=UTC)
            except ValueError:
                continue
        return None

    @dataclass
    class _ExifCreatedAtSource:
        """Parsed $exif.created_at:{image_field}|{fallback} default specification."""

        image_field: str
        fallback: str | None

    @staticmethod
    def get_exif_source_field(default: FieldValueType) -> str | None:
        """Extract IMAGE field name from $exif.created_at:{field} default.

        Returns the name of the IMAGE field that provides EXIF created_at timestamp,
        or None if default is not an EXIF reference.
        """
        if not isinstance(default, str):
            return None
        source = DateTimeValidator._parse_exif_created_at_source(default)
        return source.image_field if source else None

    @staticmethod
    def _parse_exif_created_at_source(value: str) -> _ExifCreatedAtSource | None:
        """Parse $exif.created_at:{field}|{fallback} syntax into components."""
        if not value.startswith("$exif.created_at:"):
            return None
        rest = value[17:]
        parts = rest.split("|", 1)
        image_field = parts[0]
        fallback = parts[1] if len(parts) > 1 else None
        if not image_field:
            return None
        return DateTimeValidator._ExifCreatedAtSource(image_field, fallback)

    @classmethod
    def _validate_field(cls, field: SpaceField, space: Space) -> SpaceField:
        if field.default is None:
            return field

        if field.default == SpecialValue.NOW:
            return field

        if isinstance(field.default, datetime):
            return field

        if isinstance(field.default, str):
            source = cls._parse_exif_created_at_source(field.default)
            if source:
                cls._validate_exif_source(source, space)
                return field

        raise ValidationError("DATETIME field default must be datetime, $now, or $exif.created_at:{field}")

    @classmethod
    def _validate_exif_source(cls, source: _ExifCreatedAtSource, space: Space) -> None:
        """Validate that EXIF source references a valid IMAGE field."""
        ref_field = space.get_field(source.image_field)
        if ref_field is None:
            raise ValidationError(f"EXIF default references unknown field: {source.image_field}")
        if ref_field.type != FieldType.IMAGE:
            raise ValidationError(f"EXIF default must reference IMAGE field, got {ref_field.type}")

        if (
            source.fallback is not None
            and source.fallback != SpecialValue.NOW
            and cls._parse_datetime_string(source.fallback) is None
        ):
            raise ValidationError(f"Invalid EXIF fallback: {source.fallback}. Use $now or datetime literal")

    @classmethod
    def _parse_value(cls, field: SpaceField, _space: Space, raw: str | None, ctx: ParseContext) -> FieldValueType:
        if raw is None:
            if field.default is not None:
                if field.default == SpecialValue.NOW:
                    return datetime.now(UTC)

                if isinstance(field.default, str):
                    source = cls._parse_exif_created_at_source(field.default)
                    if source:
                        return cls._resolve_exif_source(source, ctx)

                return field.default
            if field.required:
                raise ValidationError(f"Required field '{field.name}' has no value")
            return None

        if raw == "" and not field.required:
            return None

        if raw == SpecialValue.NOW:
            return datetime.now(UTC)

        parsed = cls._parse_datetime_string(raw)
        if parsed is not None:
            return parsed

        raise ValidationError(f"Invalid datetime format for field '{field.name}': {raw}")

    @classmethod
    def _resolve_exif_source(cls, source: _ExifCreatedAtSource, ctx: ParseContext) -> datetime | None:
        """Extract EXIF created_at from the referenced IMAGE field's pending attachment."""
        if not ctx.raw_fields or not ctx.pending_attachments:
            return cls._resolve_fallback(source.fallback)

        raw_value = ctx.raw_fields.get(source.image_field)
        if not raw_value:
            return cls._resolve_fallback(source.fallback)

        try:
            pending_number = int(raw_value)
        except ValueError:
            return cls._resolve_fallback(source.fallback)

        pending = next((p for p in ctx.pending_attachments if p.number == pending_number), None)
        if not pending or not pending.meta.image or not pending.meta.image.exif_created_at:
            return cls._resolve_fallback(source.fallback)

        return pending.meta.image.exif_created_at

    @classmethod
    def _resolve_fallback(cls, fallback: str | None) -> datetime | None:
        if fallback is None:
            return None
        if fallback == SpecialValue.NOW:
            return datetime.now(UTC)
        return cls._parse_datetime_string(fallback)


class UserValidator(FieldValidator):
    """Validator for user reference fields."""

    @classmethod
    def _validate_field(cls, field: SpaceField, space: Space) -> SpaceField:
        if field.default is not None and isinstance(field.default, str):
            if field.default == SpecialValue.ME:
                return field

            if field.default not in space.members:
                raise ValidationError(f"Default user '{field.default}' is not a member of this space")

        return field

    @classmethod
    def _parse_value(cls, field: SpaceField, space: Space, raw: str | None, ctx: ParseContext) -> FieldValueType:
        if raw is None:
            if field.default is not None:
                if field.default == SpecialValue.ME:
                    if not ctx.current_user:
                        raise ValidationError(f"Cannot use '{SpecialValue.ME}' without a logged-in user context")
                    if ctx.current_user not in space.members:
                        raise ValidationError("Current user is not a member of this space")
                    return ctx.current_user
                return field.default
            if field.required:
                raise ValidationError(f"Required field '{field.name}' has no value")
            return None

        if raw == "" and not field.required:
            return None

        if raw == SpecialValue.ME:
            if not ctx.current_user:
                raise ValidationError(f"Cannot use '{SpecialValue.ME}' without a logged-in user context")
            if ctx.current_user not in space.members:
                raise ValidationError("Current user is not a member of this space")
            return ctx.current_user

        if raw not in space.members:
            raise ValidationError(f"User '{raw}' is not a member of this space")

        return raw


class ImageValidator(FieldValidator):
    """Validator for image fields (stores pending_number, converted to attachment_number)."""

    @classmethod
    def _validate_field(cls, field: SpaceField, _space: Space) -> SpaceField:
        if not isinstance(field.options, ImageFieldOptions):
            raise ValidationError("IMAGE field options must be ImageFieldOptions")
        return field

    @classmethod
    def _parse_value(cls, field: SpaceField, _space: Space, raw: str | None, _ctx: ParseContext) -> FieldValueType:
        if raw is None:
            if field.default is not None:
                return field.default
            if field.required:
                raise ValidationError(f"Required field '{field.name}' has no value")
            return None

        if raw == "" and not field.required:
            return None

        try:
            return int(raw)
        except ValueError as e:
            raise ValidationError(f"Invalid image reference for field '{field.name}': {raw}") from e


VALIDATORS: dict[FieldType, type[FieldValidator]] = {
    FieldType.STRING: StringValidator,
    FieldType.BOOLEAN: BooleanValidator,
    FieldType.NUMERIC: NumericValidator,
    FieldType.SELECT: SelectValidator,
    FieldType.TAGS: TagsValidator,
    FieldType.DATETIME: DateTimeValidator,
    FieldType.USER: UserValidator,
    FieldType.IMAGE: ImageValidator,
}
