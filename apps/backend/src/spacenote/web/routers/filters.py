from fastapi import APIRouter

from spacenote.core.modules.filter.models import Filter
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.openapi import ErrorResponse

router = APIRouter(tags=["filters"])


@router.post(
    "/spaces/{space_slug}/filters",
    summary="Add filter to space",
    description="Add a new filter to an existing space. Only accessible by admin users.",
    operation_id="addFilterToSpace",
    responses={
        200: {"description": "Returns validated filter"},
        400: {"model": ErrorResponse, "description": "Invalid filter data or filter name already exists"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def add_filter(space_slug: str, filter: Filter, app: AppDep, auth_token: AuthTokenDep) -> Filter:
    """Add filter to space (admin only). Returns validated filter."""
    return await app.add_filter(auth_token, space_slug, filter)


@router.put(
    "/spaces/{space_slug}/filters/{filter_name}",
    summary="Update filter in space",
    description="Update a filter in a space. Only accessible by admin users. "
    "If name in body differs from filter_name in URL, the filter will be renamed. "
    "The 'all' filter can only have sort and default_columns modified.",
    operation_id="updateFilterInSpace",
    responses={
        200: {"description": "Returns updated filter"},
        400: {"model": ErrorResponse, "description": "Invalid filter data or new name already exists"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space or filter not found"},
    },
)
async def update_filter(space_slug: str, filter_name: str, filter: Filter, app: AppDep, auth_token: AuthTokenDep) -> Filter:
    """Update filter in space (admin only). Returns validated filter."""
    return await app.update_filter(auth_token, space_slug, filter_name, filter)


@router.delete(
    "/spaces/{space_slug}/filters/{filter_name}",
    summary="Remove filter from space",
    description="Remove a filter from a space. Only accessible by admin users.",
    operation_id="removeFilterFromSpace",
    status_code=204,
    responses={
        204: {"description": "Filter removed successfully"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space or filter not found"},
    },
)
async def remove_filter(space_slug: str, filter_name: str, app: AppDep, auth_token: AuthTokenDep) -> None:
    """Remove filter from space (admin only)."""
    await app.remove_filter(auth_token, space_slug, filter_name)
