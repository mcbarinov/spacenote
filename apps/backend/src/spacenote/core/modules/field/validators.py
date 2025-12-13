"""Field validators for definition validation and value parsing."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation

from spacenote.core.modules.field.models import (
    FieldOption,
    FieldType,
    FieldValueType,
    NumericFieldOptions,
    SpaceField,
    SpecialValue,
    StringFieldOptions,
)
from spacenote.core.modules.space.models import Space
from spacenote.errors import ValidationError


@dataclass
class ParseContext:
    """Context for parsing field values."""

    current_user: str | None = None


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
            if field.options.kind == "single_line" and "\n" in value:
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
        if not isinstance(field.options, dict):
            raise ValidationError("SELECT field options must be a dict")
        if FieldOption.VALUES not in field.options:
            raise ValidationError("SELECT fields must have 'values' option")

        values = field.options[FieldOption.VALUES]
        if not isinstance(values, list) or not all(isinstance(v, str) for v in values):
            raise ValidationError("SELECT 'values' must be a list of strings")

        if field.default and field.default not in values:
            raise ValidationError(f"Default value '{field.default}' is not in allowed values")

        if FieldOption.VALUE_MAPS in field.options:
            value_maps = field.options[FieldOption.VALUE_MAPS]
            if isinstance(value_maps, dict):
                cls._validate_value_maps(value_maps, values)

        return field

    @classmethod
    def _validate_value_maps(cls, value_maps: dict[str, dict[str, str]], values: list[str]) -> None:
        """Validate VALUE_MAPS structure."""
        if not isinstance(value_maps, dict):
            raise ValidationError("value_maps must be a dictionary")

        for map_name, map_data in value_maps.items():
            if not isinstance(map_name, str):
                raise ValidationError(f"value_maps keys must be strings, got {type(map_name).__name__}")

            if not isinstance(map_data, dict):
                raise ValidationError(f"value_maps['{map_name}'] must be a dictionary")

            missing_keys = set(values) - set(map_data.keys())
            if missing_keys:
                raise ValidationError(f"value_maps['{map_name}'] missing entries for: {', '.join(missing_keys)}")

            extra_keys = set(map_data.keys()) - set(values)
            if extra_keys:
                raise ValidationError(f"value_maps['{map_name}'] has unknown keys: {', '.join(extra_keys)}")

            for key, value in map_data.items():
                if not isinstance(value, str):
                    raise ValidationError(f"value_maps['{map_name}']['{key}'] must be a string, got {type(value).__name__}")

    @classmethod
    def _parse_value(cls, field: SpaceField, _space: Space, raw: str | None, _ctx: ParseContext) -> FieldValueType:
        if not isinstance(field.options, dict):
            raise ValidationError("Invalid field configuration: SELECT field options must be a dict")
        if raw is None:
            if field.default is not None:
                return field.default
            if field.required:
                raise ValidationError(f"Required field '{field.name}' has no value")
            return None

        if raw == "" and not field.required:
            return None

        values = field.options[FieldOption.VALUES]
        if not isinstance(values, list):
            raise ValidationError("Invalid field configuration: VALUES must be a list")

        if raw not in values:
            raise ValidationError(f"Invalid choice for field '{field.name}': '{raw}'. Allowed: {', '.join(values)}")

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
    """Validator for datetime fields."""

    @classmethod
    def _validate_field(cls, field: SpaceField, _space: Space) -> SpaceField:
        if field.default and field.default != SpecialValue.NOW and not isinstance(field.default, datetime):
            raise ValidationError("DATETIME field default must be datetime or $now")
        return field

    @classmethod
    def _parse_value(cls, field: SpaceField, _space: Space, raw: str | None, _ctx: ParseContext) -> FieldValueType:
        if raw is None:
            if field.default is not None:
                if field.default == SpecialValue.NOW:
                    return datetime.now(UTC)
                return field.default
            if field.required:
                raise ValidationError(f"Required field '{field.name}' has no value")
            return None

        if raw == "" and not field.required:
            return None

        if raw == SpecialValue.NOW:
            return datetime.now(UTC)

        for fmt in [
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
            "%Y-%m-%dT%H:%M:%S.%f",
            "%Y-%m-%dT%H:%M:%SZ",
        ]:
            try:
                return datetime.strptime(raw, fmt).replace(tzinfo=UTC)
            except ValueError:
                continue

        raise ValidationError(f"Invalid datetime format for field '{field.name}': {raw}")


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
        if not isinstance(field.options, dict):
            raise ValidationError("IMAGE field options must be a dict")
        if FieldOption.MAX_WIDTH in field.options:
            val = field.options[FieldOption.MAX_WIDTH]
            if not isinstance(val, int) or val <= 0:
                raise ValidationError("max_width must be a positive integer")
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
