from fastapi import APIRouter

from spacenote.core.modules.field.models import SpaceField
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.openapi import ErrorResponse

router = APIRouter(tags=["fields"])


@router.post(
    "/spaces/{space_slug}/fields",
    summary="Add field to space",
    description="Add a new field definition to an existing space. Only accessible by admin users.",
    operation_id="addFieldToSpace",
    responses={
        200: {"description": "Returns validated field"},
        400: {"model": ErrorResponse, "description": "Invalid field data or field name already exists"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def add_field_to_space(space_slug: str, field: SpaceField, app: AppDep, auth_token: AuthTokenDep) -> SpaceField:
    """Add field to space (admin only). Returns validated field."""
    return await app.add_field(auth_token, space_slug, field)


@router.delete(
    "/spaces/{space_slug}/fields/{field_name}",
    summary="Remove field from space",
    description="Remove a field definition from a space. Only accessible by admin users.",
    operation_id="removeFieldFromSpace",
    status_code=204,
    responses={
        204: {"description": "Field removed successfully"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space or field not found"},
    },
)
async def remove_field_from_space(space_slug: str, field_name: str, app: AppDep, auth_token: AuthTokenDep) -> None:
    """Remove field from space (admin only)."""
    await app.remove_field(auth_token, space_slug, field_name)
