"""Filter validation utilities."""

from datetime import UTC, datetime

from spacenote.core.modules.field.models import FieldOption, FieldType, FieldValueType, SpaceField, SpecialValue
from spacenote.core.modules.filter.models import (
    FIELD_TYPE_OPERATORS,
    Filter,
    FilterCondition,
    FilterOperator,
    get_field,
)
from spacenote.core.modules.space.models import Space
from spacenote.errors import ValidationError


def validate_notes_list_columns(space: Space, columns: list[str]) -> list[str]:
    """Validate column references for notes list."""
    for column in columns:
        if not get_field(space, column):
            raise ValidationError(f"Unknown column: {column}")
    return columns


def validate_filter(space: Space, filter: Filter) -> Filter:
    """Validate filter and return normalized version."""
    if not filter.name or not filter.name.replace("_", "").replace("-", "").isalnum():
        raise ValidationError(f"Invalid filter name: {filter.name}")

    validated_conditions = [_validate_condition(c, space) for c in filter.conditions]
    validated_sort = [_validate_sort_field(s, space) for s in filter.sort]
    validate_notes_list_columns(space, filter.notes_list_default_columns)

    return Filter(
        name=filter.name,
        notes_list_default_columns=filter.notes_list_default_columns,
        conditions=validated_conditions,
        sort=validated_sort,
    )


def _validate_string_value(field: SpaceField, value: FieldValueType) -> str:
    """Validate and normalize string field filter value."""
    if not isinstance(value, str):
        raise ValidationError(f"Filter value for string field '{field.name}' must be a string, got {type(value).__name__}")
    return value


def _validate_boolean_value(field: SpaceField, value: FieldValueType) -> bool:
    """Validate and normalize boolean field filter value."""
    if not isinstance(value, bool):
        raise ValidationError(f"Filter value for boolean field '{field.name}' must be a boolean, got {type(value).__name__}")
    return value


def _validate_int_value(field: SpaceField, value: FieldValueType) -> int:
    """Validate and normalize integer field filter value."""
    if isinstance(value, str):
        try:
            return int(value)
        except ValueError as e:
            raise ValidationError(f"Filter value for integer field '{field.name}' must be an integer, got string: {value}") from e

    if not isinstance(value, int) or isinstance(value, bool):
        raise ValidationError(f"Filter value for integer field '{field.name}' must be an integer, got {type(value).__name__}")

    return value


def _validate_float_value(field: SpaceField, value: FieldValueType) -> float:
    """Validate and normalize float field filter value."""
    if isinstance(value, str):
        try:
            return float(value)
        except ValueError as e:
            raise ValidationError(f"Filter value for float field '{field.name}' must be a number, got string: {value}") from e

    if not isinstance(value, int | float) or isinstance(value, bool):
        raise ValidationError(f"Filter value for float field '{field.name}' must be a number, got {type(value).__name__}")

    return float(value)


def _validate_datetime_value(field: SpaceField, value: FieldValueType) -> datetime:
    """Validate and normalize datetime field filter value."""
    if isinstance(value, str):
        datetime_formats = [
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
            "%Y-%m-%dT%H:%M:%S.%f",
            "%Y-%m-%dT%H:%M:%SZ",
        ]
        for fmt in datetime_formats:
            try:
                return datetime.strptime(value, fmt).replace(tzinfo=UTC)
            except ValueError:
                continue
        raise ValidationError(f"Invalid datetime format for filter on field '{field.name}': {value}")

    if not isinstance(value, datetime):
        raise ValidationError(f"Filter value for datetime field '{field.name}' must be a datetime or valid datetime string")

    return value


def _validate_user_value(field: SpaceField, value: FieldValueType, space: Space) -> str:
    """Validate and normalize user field filter value."""
    if value == SpecialValue.ME:
        return SpecialValue.ME

    if not isinstance(value, str):
        raise ValidationError(f"Filter value for user field '{field.name}' must be a username string or '$me'")

    if value not in space.members:
        raise ValidationError(f"User '{value}' is not a member of this space")

    return value


def _validate_select_value(field: SpaceField, operator: FilterOperator, value: FieldValueType) -> str | list[str]:
    """Validate and normalize select field filter value."""
    allowed_values = field.options.get(FieldOption.VALUES)
    if not allowed_values or not isinstance(allowed_values, list):
        raise ValidationError(f"Select field '{field.name}' must have VALUES option defined")

    if operator in (FilterOperator.IN, FilterOperator.NIN):
        if not isinstance(value, list):
            raise ValidationError(f"Filter value for operator '{operator}' on field '{field.name}' must be a list")
        for item in value:
            if not isinstance(item, str):
                raise ValidationError(f"All values in list for field '{field.name}' must be strings")
            if item not in allowed_values:
                raise ValidationError(
                    f"Invalid choice for field '{field.name}': '{item}'. Allowed values: {', '.join(allowed_values)}"
                )
        return value

    if not isinstance(value, str):
        raise ValidationError(f"Filter value for select field '{field.name}' must be a string")
    if value not in allowed_values:
        raise ValidationError(f"Invalid choice for field '{field.name}': '{value}'. Allowed values: {', '.join(allowed_values)}")
    return value


def _validate_tags_value(field: SpaceField, value: FieldValueType) -> list[str]:
    """Validate and normalize tags field filter value."""
    if not isinstance(value, list):
        raise ValidationError(f"Filter value for tags field '{field.name}' must be a list")
    for item in value:
        if not isinstance(item, str):
            raise ValidationError(f"All values in list for tags field '{field.name}' must be strings")
    return value


def _validate_filter_value(field: SpaceField, operator: FilterOperator, value: FieldValueType, space: Space) -> FieldValueType:
    """Validate and normalize a filter value to match storage format."""
    if value is None:
        if operator not in (FilterOperator.EQ, FilterOperator.NE):
            raise ValidationError(f"Operator '{operator}' cannot be used with null values")
        return None

    if field.type == FieldType.SELECT:
        return _validate_select_value(field, operator, value)
    if field.type in {FieldType.STRING, FieldType.MARKDOWN}:
        return _validate_string_value(field, value)
    if field.type == FieldType.BOOLEAN:
        return _validate_boolean_value(field, value)
    if field.type == FieldType.INT:
        return _validate_int_value(field, value)
    if field.type == FieldType.FLOAT:
        return _validate_float_value(field, value)
    if field.type == FieldType.DATETIME:
        return _validate_datetime_value(field, value)
    if field.type == FieldType.USER:
        return _validate_user_value(field, value, space)
    if field.type == FieldType.TAGS:
        return _validate_tags_value(field, value)

    return value


def _validate_condition(condition: FilterCondition, space: Space) -> FilterCondition:
    """Validate a single filter condition."""
    field = get_field(space, condition.field)
    if not field:
        raise ValidationError(f"Unknown field in condition: {condition.field}")

    allowed_operators = FIELD_TYPE_OPERATORS.get(field.type)
    if not allowed_operators:
        raise ValidationError(f"Field type '{field.type}' does not support filtering")

    if condition.operator not in allowed_operators:
        raise ValidationError(f"Operator '{condition.operator}' not valid for field '{condition.field}' of type '{field.type}'")

    validated_value = _validate_filter_value(field, condition.operator, condition.value, space)
    return FilterCondition(field=condition.field, operator=condition.operator, value=validated_value)


def _validate_sort_field(sort_field: str, space: Space) -> str:
    """Validate a single sort field."""
    field_name = sort_field.lstrip("-")
    if not get_field(space, field_name):
        raise ValidationError(f"Unknown field in sort: {field_name}")
    return sort_field
