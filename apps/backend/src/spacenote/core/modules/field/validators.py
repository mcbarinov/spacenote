"""Field validators for definition validation and value parsing."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import UTC, datetime

from spacenote.core.modules.field.models import FieldOption, FieldType, FieldValueType, SpaceField, SpecialValue
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

        return raw


class MarkdownValidator(FieldValidator):
    """Validator for markdown fields."""

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

        return raw


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


class IntValidator(FieldValidator):
    """Validator for integer fields."""

    @classmethod
    def _validate_field(cls, field: SpaceField, _space: Space) -> SpaceField:
        for opt in (FieldOption.MIN, FieldOption.MAX):
            if opt in field.options:
                val = field.options[opt]
                if not isinstance(val, (int, float)):
                    raise ValidationError(f"{opt} must be numeric")
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
            int_value = int(raw)
        except ValueError as e:
            raise ValidationError(f"Invalid integer value for field '{field.name}': {raw}") from e

        cls._validate_numeric_range(field, int_value)
        return int_value

    @classmethod
    def _validate_numeric_range(cls, field: SpaceField, value: int) -> None:
        """Validate numeric value is within min/max range."""
        if FieldOption.MIN in field.options:
            min_val = field.options[FieldOption.MIN]
            if isinstance(min_val, (int, float)) and value < min_val:
                raise ValidationError(f"Value for field '{field.name}' is below minimum: {value} < {min_val}")

        if FieldOption.MAX in field.options:
            max_val = field.options[FieldOption.MAX]
            if isinstance(max_val, (int, float)) and value > max_val:
                raise ValidationError(f"Value for field '{field.name}' is above maximum: {value} > {max_val}")


class FloatValidator(FieldValidator):
    """Validator for float fields."""

    @classmethod
    def _validate_field(cls, field: SpaceField, _space: Space) -> SpaceField:
        for opt in (FieldOption.MIN, FieldOption.MAX):
            if opt in field.options:
                val = field.options[opt]
                if not isinstance(val, (int, float)):
                    raise ValidationError(f"{opt} must be numeric")
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
            float_value = float(raw)
        except ValueError as e:
            raise ValidationError(f"Invalid float value for field '{field.name}': {raw}") from e

        cls._validate_numeric_range(field, float_value)
        return float_value

    @classmethod
    def _validate_numeric_range(cls, field: SpaceField, value: float) -> None:
        """Validate numeric value is within min/max range."""
        if FieldOption.MIN in field.options:
            min_val = field.options[FieldOption.MIN]
            if isinstance(min_val, (int, float)) and value < min_val:
                raise ValidationError(f"Value for field '{field.name}' is below minimum: {value} < {min_val}")

        if FieldOption.MAX in field.options:
            max_val = field.options[FieldOption.MAX]
            if isinstance(max_val, (int, float)) and value > max_val:
                raise ValidationError(f"Value for field '{field.name}' is above maximum: {value} > {max_val}")


class SelectValidator(FieldValidator):
    """Validator for select fields."""

    @classmethod
    def _validate_field(cls, field: SpaceField, _space: Space) -> SpaceField:
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
    FieldType.MARKDOWN: MarkdownValidator,
    FieldType.BOOLEAN: BooleanValidator,
    FieldType.INT: IntValidator,
    FieldType.FLOAT: FloatValidator,
    FieldType.SELECT: SelectValidator,
    FieldType.TAGS: TagsValidator,
    FieldType.DATETIME: DateTimeValidator,
    FieldType.USER: UserValidator,
    FieldType.IMAGE: ImageValidator,
}
