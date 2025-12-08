from fastapi import APIRouter
from pydantic import BaseModel, Field

from spacenote.core.modules.space.models import Space
from spacenote.core.modules.telegram.models import TelegramSettings
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.openapi import ErrorResponse

router = APIRouter(tags=["spaces"])


class CreateSpaceRequest(BaseModel):
    """Space creation request."""

    slug: str = Field(..., min_length=1, description="URL-friendly unique identifier for the space")
    title: str = Field(..., min_length=1, max_length=100, description="Space title")
    description: str = Field(default="", max_length=1000, description="Space description")
    members: list[str] = Field(default_factory=list, description="List of member usernames")


class UpdateTitleRequest(BaseModel):
    """Space title update request."""

    title: str = Field(..., min_length=1, max_length=100, description="New space title")


class UpdateDescriptionRequest(BaseModel):
    """Space description update request."""

    description: str = Field(..., max_length=1000, description="New space description")


class UpdateMembersRequest(BaseModel):
    """Space members update request."""

    members: list[str] = Field(..., description="New list of member usernames")


class UpdateHiddenFieldsOnCreateRequest(BaseModel):
    """Space hidden fields on create update request."""

    hidden_fields_on_create: list[str] = Field(..., description="Field names to hide on note creation form")


class UpdateTelegramRequest(BaseModel):
    """Space telegram settings update request."""

    telegram: TelegramSettings | None = None


@router.get(
    "/spaces",
    summary="List spaces",
    description="Get all spaces. Admin sees all spaces, regular users see only spaces where they are members.",
    operation_id="listSpaces",
    responses={
        200: {"description": "List of spaces"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
    },
)
async def list_spaces(app: AppDep, auth_token: AuthTokenDep) -> list[Space]:
    """Get spaces based on user role."""
    return await app.get_spaces(auth_token)


@router.post(
    "/spaces",
    summary="Create new space",
    description="Create a new space. Only accessible by admin users.",
    operation_id="createSpace",
    status_code=201,
    responses={
        201: {"description": "Space created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
    },
)
async def create_space(create_data: CreateSpaceRequest, app: AppDep, auth_token: AuthTokenDep) -> Space:
    """Create new space (admin only)."""
    return await app.create_space(auth_token, create_data.slug, create_data.title, create_data.description, create_data.members)


@router.patch(
    "/spaces/{slug}/title",
    summary="Update space title",
    description="Update space title. Only accessible by admin users.",
    operation_id="updateSpaceTitle",
    responses={
        200: {"description": "Space title updated successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def update_space_title(slug: str, update_data: UpdateTitleRequest, app: AppDep, auth_token: AuthTokenDep) -> Space:
    """Update space title (admin only)."""
    return await app.update_space_title(auth_token, slug, update_data.title)


@router.patch(
    "/spaces/{slug}/description",
    summary="Update space description",
    description="Update space description. Only accessible by admin users.",
    operation_id="updateSpaceDescription",
    responses={
        200: {"description": "Space description updated successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def update_space_description(
    slug: str, update_data: UpdateDescriptionRequest, app: AppDep, auth_token: AuthTokenDep
) -> Space:
    """Update space description (admin only)."""
    return await app.update_space_description(auth_token, slug, update_data.description)


@router.patch(
    "/spaces/{slug}/members",
    summary="Update space members",
    description="Update space members list. Only accessible by admin users.",
    operation_id="updateSpaceMembers",
    responses={
        200: {"description": "Space members updated successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def update_space_members(slug: str, update_data: UpdateMembersRequest, app: AppDep, auth_token: AuthTokenDep) -> Space:
    """Update space members (admin only)."""
    return await app.update_space_members(auth_token, slug, update_data.members)


@router.patch(
    "/spaces/{slug}/hidden-fields-on-create",
    summary="Update hidden fields on create",
    description="Update which fields are hidden on note creation form. Only accessible by admin users.",
    operation_id="updateSpaceHiddenFieldsOnCreate",
    responses={
        200: {"description": "Hidden fields on create updated successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def update_space_hidden_fields_on_create(
    slug: str, update_data: UpdateHiddenFieldsOnCreateRequest, app: AppDep, auth_token: AuthTokenDep
) -> Space:
    """Update hidden fields on create (admin only)."""
    return await app.update_hidden_fields_on_create(auth_token, slug, update_data.hidden_fields_on_create)


@router.patch(
    "/spaces/{slug}/telegram",
    summary="Update space telegram settings",
    description="Update telegram integration settings for the space. Only accessible by admin users.",
    operation_id="updateSpaceTelegram",
    responses={
        200: {"description": "Space telegram settings updated successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def update_space_telegram(slug: str, update_data: UpdateTelegramRequest, app: AppDep, auth_token: AuthTokenDep) -> Space:
    """Update space telegram settings (admin only)."""
    return await app.update_space_telegram(auth_token, slug, update_data.telegram)


@router.delete(
    "/spaces/{slug}",
    summary="Delete space",
    description="Delete a space. Only accessible by admin users.",
    operation_id="deleteSpace",
    status_code=204,
    responses={
        204: {"description": "Space deleted successfully"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def delete_space(slug: str, app: AppDep, auth_token: AuthTokenDep) -> None:
    """Delete space (admin only)."""
    await app.delete_space(auth_token, slug)
