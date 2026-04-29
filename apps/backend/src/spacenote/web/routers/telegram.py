from typing import Annotated

from fastapi import APIRouter, Query
from pydantic import BaseModel

from spacenote.core.modules.space.models import Space
from spacenote.core.modules.telegram.models import (
    TelegramMirror,
    TelegramTask,
    TelegramTaskStatus,
    TelegramTaskType,
    TelegramTestResult,
)
from spacenote.core.pagination import PaginationResult
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.openapi import ErrorResponse

router = APIRouter(tags=["telegram"])


class SetActivityChannelRequest(BaseModel):
    """Activity channel update request. `channel: null` clears it."""

    channel: str | None = None


class EnableMirrorRequest(BaseModel):
    """Enable mirror request. The channel where all current and future notes will be mirrored."""

    channel: str


class TestChannelRequest(BaseModel):
    """Connectivity test request. Channel is supplied explicitly (not read from settings) so it
    can be probed before being saved as activity/mirror channel."""

    channel: str


@router.put(
    "/spaces/{space_slug}/telegram/activity",
    summary="Set space activity channel",
    description="Set or clear the Telegram activity channel for the space. Requires 'all' permission.",
    operation_id="setActivityChannel",
    responses={
        200: {"description": "Activity channel updated"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Space management permission required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def set_activity_channel(space_slug: str, body: SetActivityChannelRequest, app: AppDep, auth_token: AuthTokenDep) -> Space:
    """Set or clear the activity channel."""
    return await app.set_activity_channel(auth_token, space_slug, body.channel)


@router.post(
    "/spaces/{space_slug}/telegram/mirror",
    summary="Enable space mirror channel",
    description=(
        "Enable mirroring on the given channel. Idempotent for the same channel. Rejects with 400 if mirror is "
        "already enabled on a different channel — disable first. On first enable, schedules MIRROR_CREATE for every "
        "existing note (B003 FIFO order). See B004 in docs/behavior.md."
    ),
    operation_id="enableMirror",
    responses={
        200: {"description": "Mirror enabled (or already on the same channel)"},
        400: {"model": ErrorResponse, "description": "Mirror already enabled on a different channel"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Space management permission required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def enable_mirror(space_slug: str, body: EnableMirrorRequest, app: AppDep, auth_token: AuthTokenDep) -> Space:
    """Enable the mirror channel."""
    return await app.enable_mirror(auth_token, space_slug, body.channel)


@router.delete(
    "/spaces/{space_slug}/telegram/mirror",
    summary="Disable space mirror channel",
    description=(
        "Disable mirroring. Wipes all mirror_* tasks and TelegramMirror records for the space. The Telegram channel "
        "itself is not modified. Idempotent. See B004 in docs/behavior.md."
    ),
    operation_id="disableMirror",
    responses={
        200: {"description": "Mirror disabled (or already disabled)"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Space management permission required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def disable_mirror(space_slug: str, app: AppDep, auth_token: AuthTokenDep) -> Space:
    """Disable the mirror channel."""
    return await app.disable_mirror(auth_token, space_slug)


@router.post(
    "/spaces/{space_slug}/telegram/test-channel",
    summary="Probe bot connectivity to a channel",
    description=(
        "Sends a real test message from the configured bot to the given channel and returns a structured "
        "result. Used as a pre-flight check before enabling activity/mirror. Always returns 200 on auth/"
        "permission success — check `success` field. The test message is NOT auto-deleted; the channel admin "
        "deletes it manually in Telegram. Requires 'all' permission."
    ),
    operation_id="testTelegramChannel",
    responses={
        200: {"description": "Connectivity probe result (success or structured failure)"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Space management permission required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def test_telegram_channel(
    space_slug: str, body: TestChannelRequest, app: AppDep, auth_token: AuthTokenDep
) -> TelegramTestResult:
    """Probe bot → channel connectivity by sending a test message."""
    return await app.test_telegram_channel(auth_token, space_slug, body.channel)


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


@router.get(
    "/spaces/{space_slug}/telegram/tasks/{number}",
    summary="Get telegram task",
    description="Get a single telegram task by space and number. Admin only.",
    operation_id="getTelegramTask",
    responses={
        200: {"description": "Telegram task details"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Task not found"},
    },
)
async def get_telegram_task(space_slug: str, number: int, app: AppDep, auth_token: AuthTokenDep) -> TelegramTask:
    return await app.get_telegram_task(auth_token, space_slug, number)


@router.get(
    "/telegram/mirrors",
    summary="List telegram mirrors",
    description="Get paginated telegram mirrors with optional space filter. Admin only.",
    operation_id="listTelegramMirrors",
    responses={
        200: {"description": "Paginated list of telegram mirrors"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
    },
)
async def list_telegram_mirrors(
    app: AppDep,
    auth_token: AuthTokenDep,
    space_slug: Annotated[str | None, Query(description="Filter by space slug")] = None,
    limit: Annotated[int, Query(ge=1, le=100, description="Maximum items to return")] = 50,
    offset: Annotated[int, Query(ge=0, description="Number of items to skip")] = 0,
) -> PaginationResult[TelegramMirror]:
    return await app.list_telegram_mirrors(auth_token, space_slug, limit, offset)


@router.get(
    "/spaces/{space_slug}/notes/{note_number}/telegram/mirror",
    summary="Get telegram mirror",
    description="Get telegram mirror for a specific note. Admin only.",
    operation_id="getTelegramMirror",
    responses={
        200: {"description": "Telegram mirror details"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Mirror not found"},
    },
)
async def get_telegram_mirror(space_slug: str, note_number: int, app: AppDep, auth_token: AuthTokenDep) -> TelegramMirror:
    return await app.get_telegram_mirror(auth_token, space_slug, note_number)
