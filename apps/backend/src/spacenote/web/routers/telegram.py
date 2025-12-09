from typing import Annotated

from fastapi import APIRouter, Query
from pydantic import BaseModel

from spacenote.core.modules.space.models import Space
from spacenote.core.modules.telegram.models import TelegramSettings, TelegramTask, TelegramTaskStatus, TelegramTaskType
from spacenote.core.pagination import PaginationResult
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.openapi import ErrorResponse

router = APIRouter(tags=["telegram"])


class UpdateTelegramRequest(BaseModel):
    """Space telegram settings update request."""

    telegram: TelegramSettings | None = None


@router.patch(
    "/spaces/{space_slug}/telegram",
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
async def update_space_telegram(
    space_slug: str, update_data: UpdateTelegramRequest, app: AppDep, auth_token: AuthTokenDep
) -> Space:
    """Update space telegram settings (admin only)."""
    return await app.update_space_telegram(auth_token, space_slug, update_data.telegram)


@router.get(
    "/telegram/tasks",
    summary="List telegram tasks",
    description="Get paginated telegram task history with optional filters. Admin only.",
    operation_id="listTelegramTasks",
    responses={
        200: {"description": "Paginated list of telegram tasks"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
    },
)
async def list_telegram_tasks(
    app: AppDep,
    auth_token: AuthTokenDep,
    space_slug: Annotated[str | None, Query(description="Filter by space slug")] = None,
    task_type: Annotated[TelegramTaskType | None, Query(description="Filter by task type")] = None,
    status: Annotated[TelegramTaskStatus | None, Query(description="Filter by status")] = None,
    limit: Annotated[int, Query(ge=1, le=100, description="Maximum items to return")] = 50,
    offset: Annotated[int, Query(ge=0, description="Number of items to skip")] = 0,
) -> PaginationResult[TelegramTask]:
    return await app.list_telegram_tasks(auth_token, space_slug, task_type, status, limit, offset)
