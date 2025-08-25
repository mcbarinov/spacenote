"""Filter system for querying notes."""

from enum import StrEnum

from pydantic import BaseModel

from spacenote.core.field.models import FieldValueType


class FilterOperator(StrEnum):
    """Query operators for filtering notes."""

    # Comparison
    EQ = "eq"  # equals
    NE = "ne"  # not equals

    # Text
    CONTAINS = "contains"
    STARTSWITH = "startswith"
    ENDSWITH = "endswith"

    # List/Set
    IN = "in"  # has any of
    NIN = "nin"  # has none of
    ALL = "all"  # has all

    # Numeric/Date
    GT = "gt"  # greater than
    GTE = "gte"  # greater than or equal
    LT = "lt"  # less than
    LTE = "lte"  # less than or equal


class FilterCondition(BaseModel):
    """Single filter condition."""

    field: str
    operator: FilterOperator
    value: FieldValueType


class Filter(BaseModel):
    """Saved filter configuration for a space."""

    name: str  # Unique ID within space
    title: str  # Display name
    description: str = ""
    conditions: list[FilterCondition]
    sort: list[str] = []  # Field names with optional "-" prefix for descending
    list_fields: list[str] = []  # Columns to show
