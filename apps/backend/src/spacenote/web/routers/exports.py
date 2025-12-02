from fastapi import APIRouter

from spacenote.core.modules.export.models import ExportData
from spacenote.core.modules.space.models import Space
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
        403: {"model": ErrorResponse, "description": "Not an admin"},
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


@router.post(
    "/spaces/import",
    summary="Import space",
    description="Import space from export data. Creates missing users with random passwords.",
    operation_id="importSpace",
    status_code=201,
    responses={
        201: {"description": "Space created"},
        400: {"model": ErrorResponse, "description": "Validation error (e.g., space already exists)"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not an admin"},
    },
)
async def import_space(
    app: AppDep,
    auth_token: AuthTokenDep,
    data: ExportData,
) -> Space:
    return await app.import_space(auth_token, data)
