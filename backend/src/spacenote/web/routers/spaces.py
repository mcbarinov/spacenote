from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from spacenote.core.field.models import SpaceField
from spacenote.core.space.models import SpaceView
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.schemas import ErrorResponse

router: APIRouter = APIRouter(tags=["spaces"])


class CreateSpaceRequest(BaseModel):
    """Request to create a new space."""

    slug: str = Field(
        ...,
        description="URL-friendly unique identifier (lowercase letters, numbers, hyphens; no leading/trailing/double hyphens)",
        pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )
    title: str = Field(..., description="Human-readable space name")

    model_config = {"json_schema_extra": {"examples": [{"slug": "my-tasks", "title": "My Task Tracker"}]}}


class UpdateSpaceMembersRequest(BaseModel):
    """Request to update space members."""

    usernames: list[str] = Field(..., description="List of usernames to set as space members")

    model_config = {"json_schema_extra": {"examples": [{"usernames": ["alice", "bob", "charlie"]}]}}


class UpdateSpaceTitleRequest(BaseModel):
    """Request to update space title."""

    title: str = Field(..., description="New title for the space", min_length=1)

    model_config = {"json_schema_extra": {"examples": [{"title": "My Updated Task Tracker"}]}}


class UpdateSpaceListFieldsRequest(BaseModel):
    """Request to update space list fields."""

    list_fields: list[str] = Field(..., description="Field names to show in list view")

    model_config = {"json_schema_extra": {"examples": [{"list_fields": ["title", "status", "due_date"]}]}}


class UpdateSpaceHiddenCreateFieldsRequest(BaseModel):
    """Request to update space hidden create fields."""

    hidden_create_fields: list[str] = Field(..., description="Field names to hide in create form")

    model_config = {"json_schema_extra": {"examples": [{"hidden_create_fields": ["created_at", "author"]}]}}


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
async def list_spaces(app: AppDep, auth_token: AuthTokenDep) -> list[SpaceView]:
    return await app.get_spaces_by_member(auth_token)


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
async def create_space(req: CreateSpaceRequest, app: AppDep, auth_token: AuthTokenDep) -> SpaceView:
    return await app.create_space(auth_token, req.slug, req.title)


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
async def add_field_to_space(space_slug: str, field: SpaceField, app: AppDep, auth_token: AuthTokenDep) -> SpaceView:
    return await app.add_field_to_space(auth_token, space_slug, field)


@router.put(
    "/spaces/{space_slug}/members",
    summary="Update space members",
    description="Update the list of members for a space. Only space members can update membership.",
    operation_id="updateSpaceMembers",
    responses={
        200: {"description": "Members updated successfully"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def update_space_members(
    space_slug: str, req: UpdateSpaceMembersRequest, app: AppDep, auth_token: AuthTokenDep
) -> SpaceView:
    return await app.update_space_members(auth_token, space_slug, req.usernames)


@router.patch(
    "/spaces/{space_slug}/title",
    summary="Update space title",
    description="Update the title of a space. Only space members can update the title.",
    operation_id="updateSpaceTitle",
    responses={
        200: {"description": "Title updated successfully"},
        400: {"model": ErrorResponse, "description": "Invalid title"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def update_space_title(space_slug: str, req: UpdateSpaceTitleRequest, app: AppDep, auth_token: AuthTokenDep) -> SpaceView:
    return await app.update_space_title(auth_token, space_slug, req.title)


@router.patch(
    "/spaces/{space_slug}/list-fields",
    summary="Update space list fields",
    description="Update which fields are shown in the list view. Only space members can update list fields.",
    operation_id="updateSpaceListFields",
    responses={
        200: {"description": "List fields updated successfully"},
        400: {"model": ErrorResponse, "description": "Invalid field names"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def update_space_list_fields(
    space_slug: str, req: UpdateSpaceListFieldsRequest, app: AppDep, auth_token: AuthTokenDep
) -> SpaceView:
    return await app.update_space_list_fields(auth_token, space_slug, req.list_fields)


@router.patch(
    "/spaces/{space_slug}/hidden-create-fields",
    summary="Update space hidden create fields",
    description="Update which fields are hidden in the create form. Only space members can update hidden fields.",
    operation_id="updateSpaceHiddenCreateFields",
    responses={
        200: {"description": "Hidden create fields updated successfully"},
        400: {"model": ErrorResponse, "description": "Invalid field names"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def update_space_hidden_create_fields(
    space_slug: str, req: UpdateSpaceHiddenCreateFieldsRequest, app: AppDep, auth_token: AuthTokenDep
) -> SpaceView:
    return await app.update_space_hidden_create_fields(auth_token, space_slug, req.hidden_create_fields)


@router.get(
    "/spaces/{space_slug}/export",
    summary="Export space",
    description="Export space configuration and optionally all notes and comments.",
    operation_id="exportSpace",
    responses={
        200: {"description": "Space export data"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def export_space(space_slug: str, app: AppDep, auth_token: AuthTokenDep, include_data: bool = False) -> dict[str, Any]:
    return await app.export_space(auth_token, space_slug, include_data)
