from fastapi import APIRouter
from pydantic import BaseModel

from spacenote.core.modules.space.models import Space
from spacenote.core.modules.telegram.models import TelegramSettings
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
