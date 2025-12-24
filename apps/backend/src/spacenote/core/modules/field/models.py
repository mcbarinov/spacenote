"""Field system for custom note schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Literal

from pydantic import Field, model_validator

from spacenote.core.schema import OpenAPIModel

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


class SpecialValue(StrEnum):
    """Special values for fields."""

    ME = "$me"
    NOW = "$now"


class StringFieldOptions(OpenAPIModel):
    """Options for STRING field type."""

    kind: Literal["line", "text", "markdown", "json", "toml", "yaml"] = Field(
        "line", description="String format: line (no newlines), text (multiline), markdown, json, toml, yaml"
    )
    min_length: int | None = Field(None, description="Minimum string length")
    max_length: int | None = Field(None, description="Maximum string length")

    @model_validator(mode="after")
    def validate_lengths(self) -> StringFieldOptions:
        if self.min_length is not None and self.min_length < 0:
            raise ValueError("min_length must be >= 0")
        if self.max_length is not None and self.max_length < 0:
            raise ValueError("max_length must be >= 0")
        if self.min_length is not None and self.max_length is not None and self.min_length > self.max_length:
            raise ValueError("min_length must be <= max_length")
        return self


class NumericFieldOptions(OpenAPIModel):
    """Options for NUMERIC field type."""

    kind: Literal["int", "float", "decimal"] = Field(..., description="Numeric type")
    min: float | None = Field(None, description="Minimum value")
    max: float | None = Field(None, description="Maximum value")

    @model_validator(mode="after")
    def validate_range(self) -> NumericFieldOptions:
        if self.min is not None and self.max is not None and self.min > self.max:
            raise ValueError("min must be <= max")
        return self


class BooleanFieldOptions(OpenAPIModel):
    """Options for BOOLEAN field type."""


class SelectFieldOptions(OpenAPIModel):
    """Options for SELECT field type."""

    values: list[str] = Field(..., description="Allowed values for selection")
    value_maps: dict[str, dict[str, str]] | None = Field(None, description="Named maps: map_name → {value → display_label}")

    @model_validator(mode="after")
    def validate_value_maps(self) -> SelectFieldOptions:
        if self.value_maps is None:
            return self

        for map_name, map_data in self.value_maps.items():
            missing = set(self.values) - set(map_data.keys())
            if missing:
                raise ValueError(f"value_maps['{map_name}'] missing entries for: {', '.join(missing)}")

            extra = set(map_data.keys()) - set(self.values)
            if extra:
                raise ValueError(f"value_maps['{map_name}'] has unknown keys: {', '.join(extra)}")

        return self


class TagsFieldOptions(OpenAPIModel):
    """Options for TAGS field type."""


class UserFieldOptions(OpenAPIModel):
    """Options for USER field type."""


class DatetimeFieldOptions(OpenAPIModel):
    """Options for DATETIME field type."""


class ImageFieldOptions(OpenAPIModel):
    """Options for IMAGE field type."""

    max_width: int | None = Field(None, description="Maximum width for image resizing")

    @model_validator(mode="after")
    def validate_max_width(self) -> ImageFieldOptions:
        if self.max_width is not None and self.max_width <= 0:
            raise ValueError("max_width must be a positive integer")
        return self


FieldOptionsType = (
    StringFieldOptions
    | NumericFieldOptions
    | BooleanFieldOptions
    | SelectFieldOptions
    | TagsFieldOptions
    | UserFieldOptions
    | DatetimeFieldOptions
    | ImageFieldOptions
)

FIELD_TYPE_OPTIONS: dict[FieldType, type[FieldOptionsType]] = {
    FieldType.STRING: StringFieldOptions,
    FieldType.NUMERIC: NumericFieldOptions,
    FieldType.BOOLEAN: BooleanFieldOptions,
    FieldType.SELECT: SelectFieldOptions,
    FieldType.TAGS: TagsFieldOptions,
    FieldType.USER: UserFieldOptions,
    FieldType.DATETIME: DatetimeFieldOptions,
    FieldType.IMAGE: ImageFieldOptions,
}


class SpaceField(OpenAPIModel):
    """Field definition in a space schema."""

    name: str = Field(..., description="Field identifier (must be unique within space)")
    type: FieldType = Field(..., description="Field data type")
    required: bool = Field(False, description="Whether this field is required")
    options: FieldOptionsType = Field(..., description="Field type-specific options")
    default: FieldValueType = Field(None, description="Default value for this field")

    @model_validator(mode="after")
    def coerce_options_type(self) -> SpaceField:
        """Ensure options are parsed as the correct type based on field type."""
        expected_class = FIELD_TYPE_OPTIONS.get(self.type)
        if expected_class is None:
            return self

        if isinstance(self.options, expected_class):
            return self

        if isinstance(self.options, dict):
            self.options = expected_class(**self.options)
        else:
            self.options = expected_class(**self.options.model_dump())

        return self
