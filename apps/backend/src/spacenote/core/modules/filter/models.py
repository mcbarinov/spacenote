from __future__ import annotations

from enum import StrEnum
from typing import TYPE_CHECKING

from pydantic import Field

from spacenote.core.modules.field.models import FieldType, FieldValueType, NumericFieldOptions, SpaceField
from spacenote.core.schema import OpenAPIModel

if TYPE_CHECKING:
    from spacenote.core.modules.space.models import Space


class FilterOperator(StrEnum):
    """Query operators for filtering notes."""

    # Comparison
    EQ = "eq"
    NE = "ne"
    # Text
    CONTAINS = "contains"
    STARTSWITH = "startswith"
    ENDSWITH = "endswith"
    # List/Set
    IN = "in"
    NIN = "nin"
    ALL = "all"
    # Numeric/Date
    GT = "gt"
    GTE = "gte"
    LT = "lt"
    LTE = "lte"


class FilterCondition(OpenAPIModel):
    """Single filter condition for querying notes."""

    field: str = Field(..., description="Field name to filter on")
    operator: FilterOperator = Field(..., description="Comparison operator")
    value: FieldValueType = Field(..., description="Value to compare against")


ALL_FILTER_NAME = "all"


class Filter(OpenAPIModel):
    """Filter definition for a space."""

    name: str = Field(..., description="Filter identifier (must be unique within space)")
    default_columns: list[str] = Field(
        default_factory=list,
        description="Fields to display as columns in default view mode",
    )
    conditions: list[FilterCondition] = Field(default_factory=list, description="Filter conditions (combined with AND)")
    sort: list[str] = Field(default_factory=list, description="Sort order - field names with optional '-' prefix for descending")


def create_default_all_filter() -> Filter:
    """Create the default 'all' filter for new spaces."""
    return Filter(
        name=ALL_FILTER_NAME,
        default_columns=["note.number", "note.created_at", "note.author"],
        conditions=[],
        sort=["-note.created_at"],
    )


# Valid operators for each field type
FIELD_TYPE_OPERATORS: dict[FieldType, set[FilterOperator]] = {
    FieldType.STRING: {
        FilterOperator.EQ,
        FilterOperator.NE,
        FilterOperator.CONTAINS,
        FilterOperator.STARTSWITH,
        FilterOperator.ENDSWITH,
    },
    FieldType.BOOLEAN: {
        FilterOperator.EQ,
        FilterOperator.NE,
    },
    FieldType.NUMERIC: {
        FilterOperator.EQ,
        FilterOperator.NE,
        FilterOperator.GT,
        FilterOperator.GTE,
        FilterOperator.LT,
        FilterOperator.LTE,
    },
    FieldType.DATETIME: {
        FilterOperator.EQ,
        FilterOperator.NE,
        FilterOperator.GT,
        FilterOperator.GTE,
        FilterOperator.LT,
        FilterOperator.LTE,
    },
    FieldType.SELECT: {
        FilterOperator.EQ,
        FilterOperator.NE,
        FilterOperator.IN,
        FilterOperator.NIN,
    },
    FieldType.TAGS: {
        FilterOperator.EQ,
        FilterOperator.NE,
        FilterOperator.IN,
        FilterOperator.NIN,
        FilterOperator.ALL,
    },
    FieldType.USER: {
        FilterOperator.EQ,
        FilterOperator.NE,
    },
    FieldType.IMAGE: set(),
}


def get_system_field_definitions() -> dict[str, SpaceField]:
    """System field definitions for filtering and sorting.

    System fields use 'note.' prefix to distinguish from custom fields.
    """
    return {
        "note.number": SpaceField(
            name="note.number", type=FieldType.NUMERIC, required=True, options=NumericFieldOptions(kind="int")
        ),
        "note.author": SpaceField(name="note.author", type=FieldType.USER, required=True),
        "note.created_at": SpaceField(name="note.created_at", type=FieldType.DATETIME, required=True),
        "note.edited_at": SpaceField(name="note.edited_at", type=FieldType.DATETIME, required=False),
        "note.activity_at": SpaceField(name="note.activity_at", type=FieldType.DATETIME, required=True),
    }


def get_field(space: Space, field_name: str) -> SpaceField | None:
    """Get field definition from space or system fields.

    Syntax:
    - note.number, note.author, note.created_at → system fields
    - note.fields.{name} → custom fields
    """
    if field_name.startswith("note.fields."):
        custom_field_name = field_name[len("note.fields.") :]
        return space.get_field(custom_field_name)
    if field_name.startswith("note."):
        system_fields = get_system_field_definitions()
        return system_fields.get(field_name)
    return None
