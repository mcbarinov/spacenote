from typing import Annotated

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from spacenote.core.modules.comment.models import Comment
from spacenote.core.pagination import PaginationResult
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.openapi import ErrorResponse

router = APIRouter(tags=["comments"])


class CreateCommentRequest(BaseModel):
    """Request to create a new comment."""

    content: str = Field(..., min_length=1, description="Comment content")
    parent_number: int | None = Field(None, description="Parent comment number for threading")
    raw_fields: dict[str, str] | None = Field(None, description="Fields to update (must be in space.editable_fields_on_comment)")


class UpdateCommentRequest(BaseModel):
    """Request to update comment content."""

    content: str = Field(..., min_length=1, description="Updated comment content")


@router.get(
    "/spaces/{space_slug}/notes/{note_number}/comments",
    summary="List note comments",
    description="Get paginated comments for a note. Only space members can view comments.",
    operation_id="listComments",
    responses={
        200: {"description": "Paginated list of comments"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space or note not found"},
    },
)
async def list_comments(
    space_slug: str,
    note_number: int,
    app: AppDep,
    auth_token: AuthTokenDep,
    limit: Annotated[int, Query(ge=1, le=100, description="Maximum items to return")] = 50,
    offset: Annotated[int, Query(ge=0, description="Number of items to skip")] = 0,
) -> PaginationResult[Comment]:
    return await app.list_comments(auth_token, space_slug, note_number, limit, offset)


@router.get(
    "/spaces/{space_slug}/notes/{note_number}/comments/{number}",
    summary="Get comment by number",
    description="Get a specific comment by its number. Only space members can view comments.",
    operation_id="getComment",
    responses={
        200: {"description": "Comment details"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space, note, or comment not found"},
    },
)
async def get_comment(space_slug: str, note_number: int, number: int, app: AppDep, auth_token: AuthTokenDep) -> Comment:
    return await app.get_comment(auth_token, space_slug, note_number, number)


@router.post(
    "/spaces/{space_slug}/notes/{note_number}/comments",
    summary="Create new comment",
    description="Create a new comment on a note. Only space members can comment.",
    operation_id="createComment",
    status_code=201,
    responses={
        201: {"description": "Comment created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid parent comment"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space or note not found"},
    },
)
async def create_comment(
    space_slug: str, note_number: int, request: CreateCommentRequest, app: AppDep, auth_token: AuthTokenDep
) -> Comment:
    return await app.create_comment(
        auth_token, space_slug, note_number, request.content, request.parent_number, request.raw_fields
    )


@router.patch(
    "/spaces/{space_slug}/notes/{note_number}/comments/{number}",
    summary="Update comment",
    description="Update comment content. Only the comment author can update.",
    operation_id="updateComment",
    responses={
        200: {"description": "Comment updated successfully"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not the comment author"},
        404: {"model": ErrorResponse, "description": "Space, note, or comment not found"},
    },
)
async def update_comment(
    space_slug: str, note_number: int, number: int, request: UpdateCommentRequest, app: AppDep, auth_token: AuthTokenDep
) -> Comment:
    return await app.update_comment(auth_token, space_slug, note_number, number, request.content)


@router.delete(
    "/spaces/{space_slug}/notes/{note_number}/comments/{number}",
    summary="Delete comment",
    description="Delete a comment. Only the comment author can delete. Replies are orphaned.",
    operation_id="deleteComment",
    status_code=204,
    responses={
        204: {"description": "Comment deleted successfully"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not the comment author"},
        404: {"model": ErrorResponse, "description": "Space, note, or comment not found"},
    },
)
async def delete_comment(space_slug: str, note_number: int, number: int, app: AppDep, auth_token: AuthTokenDep) -> None:
    await app.delete_comment(auth_token, space_slug, note_number, number)
