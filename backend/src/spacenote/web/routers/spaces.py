from fastapi import APIRouter

from spacenote.core.field.models import SpaceField as CoreSpaceField
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.schemas import CreateSpaceRequest, ErrorResponse, Space, SpaceField

router: APIRouter = APIRouter(tags=["spaces"])


@router.get(
    "/spaces",
    summary="List user spaces",
    description="Get all spaces where the authenticated user is a member.",
    operation_id="listSpaces",
    responses={
        200: {"description": "List of spaces"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
    },
)
async def list_spaces(app: AppDep, auth_token: AuthTokenDep) -> list[Space]:
    spaces = await app.get_spaces_by_member(auth_token)
    return [Space.from_core(space) for space in spaces]


@router.post(
    "/spaces",
    summary="Create new space",
    description="Create a new space with the specified slug and title. The authenticated user becomes a member.",
    operation_id="createSpace",
    status_code=201,
    responses={
        201: {"description": "Space created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request data or slug already exists"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
    },
)
async def create_space(req: CreateSpaceRequest, app: AppDep, auth_token: AuthTokenDep) -> Space:
    space = await app.create_space(auth_token, req.slug, req.title)
    return Space.from_core(space)


@router.post(
    "/spaces/{space_slug}/fields",
    summary="Add field to space",
    description="Add a new field definition to an existing space. Only space members can add fields.",
    operation_id="addFieldToSpace",
    responses={
        200: {"description": "Field added successfully"},
        400: {"model": ErrorResponse, "description": "Invalid field data or field name already exists"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def add_field_to_space(space_slug: str, field: SpaceField, app: AppDep, auth_token: AuthTokenDep) -> Space:
    # Convert API SpaceField to core SpaceField
    core_field = CoreSpaceField.model_validate(field.model_dump())
    space = await app.add_field_to_space(auth_token, space_slug, core_field)
    return Space.from_core(space)
