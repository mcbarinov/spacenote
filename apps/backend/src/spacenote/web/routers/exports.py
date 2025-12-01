from fastapi import APIRouter

from spacenote.core.modules.export.models import ExportData
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.openapi import ErrorResponse

router = APIRouter(tags=["export"])


@router.get(
    "/spaces/{space_slug}/export",
    summary="Export space data",
    description="Export space configuration and optionally all data (notes, comments, attachments).",
    operation_id="exportSpace",
    responses={
        200: {"description": "Space export data"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def export_space(
    space_slug: str,
    app: AppDep,
    auth_token: AuthTokenDep,
    include_data: bool = False,
) -> ExportData:
    return await app.export_space(auth_token, space_slug, include_data)
