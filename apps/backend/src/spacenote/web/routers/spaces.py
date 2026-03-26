from fastapi import APIRouter
from pydantic import BaseModel, Field

from spacenote.core.modules.space.models import Member, Space
from spacenote.utils import SLUG_RE
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.openapi import ErrorResponse

router = APIRouter(tags=["spaces"])


class CreateSpaceRequest(BaseModel):
    """Space creation request."""

    slug: str = Field(..., min_length=1, description="URL-friendly unique identifier for the space")
    title: str = Field(..., min_length=1, max_length=100, description="Space title")
    description: str = Field(default="", max_length=1000, description="Space description")
    members: list[Member] = Field(default_factory=list, description="Space members with permissions")
    source_space: str | None = Field(default=None, description="Source space slug to copy configuration from")


class UpdateTitleRequest(BaseModel):
    """Space title update request."""

    title: str = Field(..., min_length=1, max_length=100, description="New space title")


class UpdateDescriptionRequest(BaseModel):
    """Space description update request."""

    description: str = Field(..., max_length=1000, description="New space description")


class UpdateMembersRequest(BaseModel):
    """Space members update request."""

    members: list[Member] = Field(..., description="New list of space members with permissions")


class UpdateHiddenFieldsOnCreateRequest(BaseModel):
    """Space hidden fields on create update request."""

    hidden_fields_on_create: list[str] = Field(..., description="Field names to hide on note creation form")


class UpdateEditableFieldsOnCommentRequest(BaseModel):
    """Space editable fields on comment update request."""

    editable_fields_on_comment: list[str] = Field(..., description="Field names that can be edited when adding a comment")


class RenameSlugRequest(BaseModel):
    """Space slug rename request."""

    new_slug: str = Field(..., pattern=SLUG_RE.pattern, description="New URL-friendly unique identifier for the space")


class UpdateCanTransferToRequest(BaseModel):
    """Space can_transfer_to update request."""

    can_transfer_to: list[str] = Field(..., description="Space slugs where notes can be transferred to")


class UpdateDefaultFilterRequest(BaseModel):
    """Space default filter update request."""

    default_filter: str = Field(..., description="Default filter name for the space")


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
    """List spaces based on user role."""
    return await app.list_spaces(auth_token)


@router.get(
    "/spaces/all",
    summary="List all spaces (admin only)",
    description="Get all spaces regardless of membership. Only accessible by system admins.",
    operation_id="listAllSpaces",
    responses={
        200: {"description": "List of all spaces"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "System admin privileges required"},
    },
)
async def list_all_spaces(app: AppDep, auth_token: AuthTokenDep) -> list[Space]:
    """List all spaces (system admin only)."""
    return await app.list_all_spaces(auth_token)


@router.post(
    "/spaces/{slug}/admin-access",
    summary="Join space as admin",
    description="System admin adds themselves to a space with 'all' permission.",
    operation_id="adminJoinSpace",
    responses={
        200: {"description": "Successfully joined space"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "System admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def admin_join_space(slug: str, app: AppDep, auth_token: AuthTokenDep) -> Space:
    """System admin joins a space with 'all' permission."""
    return await app.admin_join_space(auth_token, slug)


@router.delete(
    "/spaces/{slug}/admin-access",
    summary="Leave space as admin",
    description="System admin removes themselves from a space.",
    operation_id="adminLeaveSpace",
    responses={
        200: {"description": "Successfully left space"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "System admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def admin_leave_space(slug: str, app: AppDep, auth_token: AuthTokenDep) -> Space:
    """System admin leaves a space."""
    return await app.admin_leave_space(auth_token, slug)


@router.post(
    "/spaces",
    summary="Create new space",
    description="Create a new space. Any authenticated user can create spaces.",
    operation_id="createSpace",
    status_code=201,
    responses={
        201: {"description": "Space created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
    },
)
async def create_space(create_data: CreateSpaceRequest, app: AppDep, auth_token: AuthTokenDep) -> Space:
    """Create new space (any authenticated user)."""
    return await app.create_space(
        auth_token, create_data.slug, create_data.title, create_data.description, create_data.members, create_data.source_space
    )


@router.patch(
    "/spaces/{slug}/title",
    summary="Update space title",
    description="Update space title. Requires 'all' permission in the space.",
    operation_id="updateSpaceTitle",
    responses={
        200: {"description": "Space title updated successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Space management permission required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def update_space_title(slug: str, update_data: UpdateTitleRequest, app: AppDep, auth_token: AuthTokenDep) -> Space:
    """Update space title (space admin only)."""
    return await app.update_space_title(auth_token, slug, update_data.title)


@router.patch(
    "/spaces/{slug}/description",
    summary="Update space description",
    description="Update space description. Requires 'all' permission in the space.",
    operation_id="updateSpaceDescription",
    responses={
        200: {"description": "Space description updated successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Space management permission required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def update_space_description(
    slug: str, update_data: UpdateDescriptionRequest, app: AppDep, auth_token: AuthTokenDep
) -> Space:
    """Update space description (space admin only)."""
    return await app.update_space_description(auth_token, slug, update_data.description)


@router.patch(
    "/spaces/{slug}/members",
    summary="Update space members",
    description="Update space members list. Requires 'all' permission in the space.",
    operation_id="updateMembers",
    responses={
        200: {"description": "Space members updated successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Space management permission required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def update_space_members(slug: str, update_data: UpdateMembersRequest, app: AppDep, auth_token: AuthTokenDep) -> Space:
    """Update space members (space admin only)."""
    return await app.update_space_members(auth_token, slug, update_data.members)


@router.patch(
    "/spaces/{slug}/hidden-fields-on-create",
    summary="Update hidden fields on create",
    description="Update which fields are hidden on note creation form. Requires 'all' permission in the space.",
    operation_id="updateSpaceHiddenFieldsOnCreate",
    responses={
        200: {"description": "Hidden fields on create updated successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Space management permission required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def update_space_hidden_fields_on_create(
    slug: str, update_data: UpdateHiddenFieldsOnCreateRequest, app: AppDep, auth_token: AuthTokenDep
) -> Space:
    """Update hidden fields on create (space admin only)."""
    return await app.update_hidden_fields_on_create(auth_token, slug, update_data.hidden_fields_on_create)


@router.patch(
    "/spaces/{slug}/editable-fields-on-comment",
    summary="Update editable fields on comment",
    description="Update which fields can be edited when adding a comment. Requires 'all' permission in the space.",
    operation_id="updateSpaceEditableFieldsOnComment",
    responses={
        200: {"description": "Editable fields on comment updated successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Space management permission required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def update_space_editable_fields_on_comment(
    slug: str, update_data: UpdateEditableFieldsOnCommentRequest, app: AppDep, auth_token: AuthTokenDep
) -> Space:
    """Update editable fields on comment (space admin only)."""
    return await app.update_editable_fields_on_comment(auth_token, slug, update_data.editable_fields_on_comment)


@router.patch(
    "/spaces/{slug}/default-filter",
    summary="Update space default filter",
    description="Update the default filter for a space. Requires 'all' permission in the space.",
    operation_id="updateSpaceDefaultFilter",
    responses={
        200: {"description": "Default filter updated successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request or filter not found"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Space management permission required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def update_space_default_filter(
    slug: str, update_data: UpdateDefaultFilterRequest, app: AppDep, auth_token: AuthTokenDep
) -> Space:
    """Update default filter (space admin only)."""
    return await app.update_default_filter(auth_token, slug, update_data.default_filter)


@router.patch(
    "/spaces/{slug}/can-transfer-to",
    summary="Update can_transfer_to",
    description="Update which spaces notes can be transferred to. Requires 'all' permission in the space.",
    operation_id="updateSpaceCanTransferTo",
    responses={
        200: {"description": "can_transfer_to updated successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request or incompatible schema"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Space management permission required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def update_space_can_transfer_to(
    slug: str, update_data: UpdateCanTransferToRequest, app: AppDep, auth_token: AuthTokenDep
) -> Space:
    """Update can_transfer_to (space admin only)."""
    return await app.update_can_transfer_to(auth_token, slug, update_data.can_transfer_to)


@router.patch(
    "/spaces/{slug}/slug",
    summary="Rename space slug",
    description="Rename space slug, updating all references. Requires 'all' permission in the space.",
    operation_id="renameSpaceSlug",
    responses={
        200: {"description": "Space slug renamed successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request or slug already exists"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Space management permission required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def rename_space_slug(slug: str, update_data: RenameSlugRequest, app: AppDep, auth_token: AuthTokenDep) -> Space:
    """Rename space slug (space admin only)."""
    return await app.rename_space_slug(auth_token, slug, update_data.new_slug)


@router.delete(
    "/spaces/{slug}",
    summary="Delete space",
    description="Delete a space. Requires 'all' permission in the space.",
    operation_id="deleteSpace",
    status_code=204,
    responses={
        204: {"description": "Space deleted successfully"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Space management permission required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def delete_space(slug: str, app: AppDep, auth_token: AuthTokenDep) -> None:
    """Delete space (space admin only)."""
    await app.delete_space(auth_token, slug)
