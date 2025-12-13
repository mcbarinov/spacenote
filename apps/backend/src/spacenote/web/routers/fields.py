from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from spacenote.core.modules.field.models import FieldValueType, SpaceField
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.openapi import ErrorResponse

router = APIRouter(tags=["fields"])


class UpdateFieldRequest(BaseModel):
    """Field update request - only editable properties."""

    required: bool = Field(..., description="Whether this field is required")
    options: dict[str, Any] = Field(default_factory=dict, description="Field type-specific options")
    default: FieldValueType = Field(None, description="Default value for this field")


@router.post(
    "/spaces/{space_slug}/fields",
    summary="Add field to space",
    description="Add a new field definition to an existing space. Only accessible by admin users.",
    operation_id="addField",
    responses={
        200: {"description": "Returns validated field"},
        400: {"model": ErrorResponse, "description": "Invalid field data or field name already exists"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def add_field(space_slug: str, field: SpaceField, app: AppDep, auth_token: AuthTokenDep) -> SpaceField:
    """Add field to space (admin only). Returns validated field."""
    return await app.add_field(auth_token, space_slug, field)


@router.put(
    "/spaces/{space_slug}/fields/{field_name}",
    summary="Update field in space",
    description="Update a field's properties in a space. Only accessible by admin users. "
    "Only required, options, and default can be changed. Type and name cannot be modified.",
    operation_id="updateField",
    responses={
        200: {"description": "Returns updated field"},
        400: {"model": ErrorResponse, "description": "Invalid field data"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space or field not found"},
    },
)
async def update_field(
    space_slug: str,
    field_name: str,
    update_data: UpdateFieldRequest,
    app: AppDep,
    auth_token: AuthTokenDep,
) -> SpaceField:
    """Update field in space (admin only). Returns validated field."""
    return await app.update_field(
        auth_token,
        space_slug,
        field_name,
        update_data.required,
        update_data.options,
        update_data.default,
    )


@router.delete(
    "/spaces/{space_slug}/fields/{field_name}",
    summary="Remove field from space",
    description="Remove a field definition from a space. Only accessible by admin users.",
    operation_id="removeField",
    status_code=204,
    responses={
        204: {"description": "Field removed successfully"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space or field not found"},
    },
)
async def remove_field(space_slug: str, field_name: str, app: AppDep, auth_token: AuthTokenDep) -> None:
    """Remove field from space (admin only)."""
    await app.remove_field(auth_token, space_slug, field_name)
