"""Field system for custom note schemas."""

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field

FieldOptionValueType = list[str] | int | float | dict[str, dict[str, str]]
FieldValueType = str | bool | list[str] | int | float | datetime | None


class FieldType(StrEnum):
    """Available field types for space schemas."""

    STRING = "string"
    MARKDOWN = "markdown"
    BOOLEAN = "boolean"
    SELECT = "select"
    TAGS = "tags"
    USER = "user"
    DATETIME = "datetime"
    INT = "int"
    FLOAT = "float"
    IMAGE = "image"


class FieldOption(StrEnum):
    """Configuration options for field types."""

    VALUES = "values"
    MIN = "min"
    MAX = "max"
    VALUE_MAPS = "value_maps"
    MAX_WIDTH = "max_width"


class SpecialValue(StrEnum):
    """Special values for fields."""

    ME = "$me"
    NOW = "$now"


class SpaceField(BaseModel):
    """Field definition in a space schema."""

    name: str = Field(..., description="Field identifier (must be unique within space)")
    type: FieldType = Field(..., description="Field data type")
    required: bool = Field(False, description="Whether this field is required")
    options: dict[FieldOption, FieldOptionValueType] = Field(
        default_factory=dict,
        description=(
            "Field type-specific options (e.g., 'values' for select, "
            "'min'/'max' for numeric types, 'value_maps' for select metadata, 'max_width' for image)"
        ),
    )
    default: FieldValueType = Field(None, description="Default value for this field")
