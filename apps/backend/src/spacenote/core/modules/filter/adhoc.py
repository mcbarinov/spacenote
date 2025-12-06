"""Adhoc query parser for notes filtering.

Adhoc Query Language
====================

Syntax
------
::

    query      = condition ("," condition)*
    condition  = field_path ":" operator ":" value
    field_path = system_field | custom_field

Delimiters
----------
- ``,`` separates conditions (AND logic)
- ``|`` separates array values (for in/nin/all operators)
- ``:`` separates field, operator, and value

Field Paths
-----------
System fields:

- ``note.number``      — sequential number (int)
- ``note.author``      — author username (user)
- ``note.created_at``  — creation timestamp (datetime)
- ``note.edited_at``   — last edit timestamp (datetime | null)
- ``note.activity_at`` — last activity timestamp (datetime)

Custom fields:

- ``note.fields.{name}`` — custom field by name

Operators
---------
- ``eq``, ``ne``           — equality (all types)
- ``gt``, ``gte``, ``lt``, ``lte`` — comparison (int, float, datetime)
- ``contains``, ``startswith``, ``endswith`` — text search (string, markdown)
- ``in``, ``nin``          — set membership (select, tags)
- ``all``              — all values present (tags)

Special Values
--------------
- ``$me``         — current user (for author/user fields)
- ``null``        — null value (case-insensitive)
- ``true``, ``false`` — boolean (case-insensitive)

Escaping
--------
Use URL-encoding for special characters in values:

- ``,`` → ``%2C``
- ``|`` → ``%7C``

Examples
--------
Single condition::

    note.fields.status:eq:new

Multiple conditions (AND)::

    note.fields.status:eq:active,note.author:eq:$me

Array values::

    note.fields.tags:in:urgent|important

Numeric range::

    note.number:gte:100,note.number:lt:200

Date filter::

    note.created_at:gte:2024-01-01

Text search::

    note.fields.title:contains:meeting
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from urllib.parse import unquote

from spacenote.core.modules.filter.models import FilterCondition, FilterOperator, get_field
from spacenote.core.modules.filter.validators import _validate_condition
from spacenote.errors import ValidationError

if TYPE_CHECKING:
    from spacenote.core.modules.space.models import Space


def parse_adhoc_query(query: str, space: Space) -> list[FilterCondition]:
    """Parse adhoc query string into filter conditions.

    Args:
        query: Adhoc query string (e.g. "note.fields.status:eq:new,note.author:eq:$me")
        space: Space to validate field names against

    Returns:
        List of FilterCondition objects

    Raises:
        ValidationError: If query syntax is invalid or field/operator not found
    """
    if not query or not query.strip():
        return []

    conditions: list[FilterCondition] = []
    raw_conditions = query.split(",")

    for raw in raw_conditions:
        raw_stripped = raw.strip()
        if not raw_stripped:
            continue

        condition = _parse_condition(raw_stripped, space)
        validated = _validate_condition(condition, space)
        conditions.append(validated)

    return conditions


def _parse_condition(raw: str, space: Space) -> FilterCondition:
    """Parse a single condition string into FilterCondition."""
    parts = raw.split(":", 2)
    if len(parts) != 3:
        raise ValidationError(f"Invalid condition syntax: '{raw}'. Expected format: field:operator:value")

    field_path, operator_str, value_raw = parts

    # Validate field exists
    field = get_field(space, field_path)
    if not field:
        raise ValidationError(f"Unknown field: '{field_path}'")

    # Validate operator
    try:
        operator = FilterOperator(operator_str)
    except ValueError:
        valid_ops = ", ".join(op.value for op in FilterOperator)
        raise ValidationError(f"Unknown operator: '{operator_str}'. Valid operators: {valid_ops}") from None

    # Parse value
    value = _parse_value(value_raw, operator)

    return FilterCondition(field=field_path, operator=operator, value=value)


def _parse_value(value_raw: str, operator: FilterOperator) -> str | int | float | bool | list[str] | None:
    """Parse and coerce value from string."""
    # URL-decode first
    value = unquote(value_raw)

    # Array operators: split by | (values stay as strings for select/tags)
    if operator in (FilterOperator.IN, FilterOperator.NIN, FilterOperator.ALL):
        return value.split("|")

    return _coerce_simple_value(value)


def _coerce_simple_value(value: str) -> str | int | float | bool | None:
    """Coerce a simple string value to appropriate type."""
    # null (case-insensitive)
    if value.lower() == "null":
        return None

    # boolean (case-insensitive)
    if value.lower() == "true":
        return True
    if value.lower() == "false":
        return False

    # integer
    if _is_integer(value):
        return int(value)

    # float
    if _is_float(value):
        return float(value)

    # string (including $me, dates, etc. - validated later)
    return value


def _is_integer(value: str) -> bool:
    """Check if value is an integer string."""
    if value.startswith("-"):
        return value[1:].isdigit() and len(value) > 1
    return value.isdigit() and len(value) > 0


def _is_float(value: str) -> bool:
    """Check if value is a float string."""
    if "." not in value:
        return False
    try:
        float(value)
    except ValueError:
        return False
    else:
        return True
