"""Field system for custom note schemas."""

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from spacenote.core.schema import OpenAPIModel

FieldOptionValueType = list[str] | int | float | Decimal | dict[str, dict[str, str]]
FieldValueType = str | bool | list[str] | int | float | Decimal | datetime | None


class FieldType(StrEnum):
    """Available field types for space schemas."""

    STRING = "string"
    BOOLEAN = "boolean"
    SELECT = "select"
    TAGS = "tags"
    USER = "user"
    DATETIME = "datetime"
    NUMERIC = "numeric"
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


class StringFieldOptions(BaseModel):
    """Options for STRING field type."""

    kind: Literal["single_line", "multi_line", "markdown", "json", "toml", "yaml"] = "single_line"
    min_length: int | None = None
    max_length: int | None = None

    @model_validator(mode="after")
    def validate_lengths(self) -> StringFieldOptions:
        if self.min_length is not None and self.min_length < 0:
            raise ValueError("min_length must be >= 0")
        if self.max_length is not None and self.max_length < 0:
            raise ValueError("max_length must be >= 0")
        if self.min_length is not None and self.max_length is not None and self.min_length > self.max_length:
            raise ValueError("min_length must be <= max_length")
        return self


class NumericFieldOptions(BaseModel):
    """Options for NUMERIC field type."""

    kind: Literal["int", "float", "decimal"]
    min: float | None = None
    max: float | None = None

    @model_validator(mode="after")
    def validate_range(self) -> NumericFieldOptions:
        if self.min is not None and self.max is not None and self.min > self.max:
            raise ValueError("min must be <= max")
        return self


class SpaceField(OpenAPIModel):
    """Field definition in a space schema."""

    name: str = Field(..., description="Field identifier (must be unique within space)")
    type: FieldType = Field(..., description="Field data type")
    required: bool = Field(False, description="Whether this field is required")
    options: StringFieldOptions | NumericFieldOptions | dict[FieldOption, FieldOptionValueType] = Field(
        default_factory=dict,
        description=(
            "Field type-specific options (StringFieldOptions for STRING, "
            "NumericFieldOptions for NUMERIC, dict for other field types: "
            "'values' for select, 'value_maps' for select metadata, 'max_width' for image)"
        ),
    )
    default: FieldValueType = Field(None, description="Default value for this field")
