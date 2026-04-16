from fastapi import APIRouter

from spacenote.core.modules.log.models import ErrorLog
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.openapi import ErrorResponse

router = APIRouter(tags=["logs"])


@router.get(
    "/admin/error-log",
    summary="Get error log",
    description="Read current error log file content (admin only).",
    operation_id="getErrorLog",
    responses={
        200: {"description": "Error log content"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "System admin privileges required"},
    },
)
async def get_error_log(app: AppDep, auth_token: AuthTokenDep) -> ErrorLog:
    return await app.get_error_log(auth_token)
