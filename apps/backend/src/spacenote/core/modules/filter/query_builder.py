import re
from typing import Any

from spacenote.core.modules.field.models import FieldValueType
from spacenote.core.modules.filter.models import FilterCondition, FilterOperator

# System field name to MongoDB field mapping
SYSTEM_FIELD_MAP: dict[str, str] = {
    "note.number": "number",
    "note.created_at": "created_at",
    "note.author": "author",
}


def get_field_path(field_name: str) -> str:
    """Map field name to MongoDB document path."""
    if field_name in SYSTEM_FIELD_MAP:
        return SYSTEM_FIELD_MAP[field_name]
    if field_name.startswith("note.fields."):
        return f"fields.{field_name[len('note.fields.') :]}"
    return f"fields.{field_name}"


def build_condition_query(operator: FilterOperator, value: FieldValueType) -> FieldValueType | dict[str, Any]:
    """Build MongoDB query expression for a single condition."""
    match operator:
        case FilterOperator.EQ:
            return value
        case FilterOperator.NE:
            return {"$ne": value}
        case FilterOperator.GT:
            return {"$gt": value}
        case FilterOperator.GTE:
            return {"$gte": value}
        case FilterOperator.LT:
            return {"$lt": value}
        case FilterOperator.LTE:
            return {"$lte": value}
        case FilterOperator.IN:
            return {"$in": value}
        case FilterOperator.NIN:
            return {"$nin": value}
        case FilterOperator.ALL:
            return {"$all": value}
        case FilterOperator.CONTAINS:
            return {"$regex": re.escape(str(value)), "$options": "i"}
        case FilterOperator.STARTSWITH:
            return {"$regex": f"^{re.escape(str(value))}", "$options": "i"}
        case FilterOperator.ENDSWITH:
            return {"$regex": f"{re.escape(str(value))}$", "$options": "i"}


def build_mongo_query(conditions: list[FilterCondition], space_slug: str, current_user: str) -> dict[str, Any]:
    """Build MongoDB query from filter conditions."""
    query: dict[str, Any] = {"space_slug": space_slug}

    for condition in conditions:
        value = condition.value
        # Resolve $me for USER fields
        if value == "$me":
            value = current_user

        field_path = get_field_path(condition.field)
        condition_query = build_condition_query(condition.operator, value)

        if field_path in query:
            # Multiple conditions on same field - use $and
            existing = query.pop(field_path)
            if "$and" not in query:
                query["$and"] = []
            query["$and"].append({field_path: existing})
            query["$and"].append({field_path: condition_query})
        else:
            query[field_path] = condition_query

    return query


def build_mongo_sort(sort_fields: list[str]) -> list[tuple[str, int]]:
    """Build MongoDB sort specification from field list."""
    if not sort_fields:
        return [("number", -1)]

    result: list[tuple[str, int]] = []
    for field in sort_fields:
        if field.startswith("-"):
            result.append((get_field_path(field[1:]), -1))
        else:
            result.append((get_field_path(field), 1))
    return result
