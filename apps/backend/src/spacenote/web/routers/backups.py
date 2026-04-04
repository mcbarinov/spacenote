from fastapi import APIRouter
from fastapi.responses import FileResponse

from spacenote.core.modules.backup.models import BackupInfo
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.openapi import ErrorResponse

router = APIRouter(tags=["backup"])


@router.post(
    "/backups",
    summary="Create database backup",
    description="Create a new database backup using mongodump (admin only).",
    operation_id="createBackup",
    status_code=201,
    responses={
        201: {"description": "Backup created"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "System admin privileges required"},
    },
)
async def create_backup(app: AppDep, auth_token: AuthTokenDep) -> BackupInfo:
    return await app.create_backup(auth_token)


@router.get(
    "/backups",
    summary="List backups",
    description="List all existing database backups (admin only).",
    operation_id="listBackups",
    responses={
        200: {"description": "List of backups"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "System admin privileges required"},
    },
)
async def list_backups(app: AppDep, auth_token: AuthTokenDep) -> list[BackupInfo]:
    return await app.list_backups(auth_token)


@router.get(
    "/backups/{filename}/download",
    summary="Download backup",
    description="Download a backup file (admin only).",
    operation_id="downloadBackup",
    responses={
        200: {"description": "Backup file", "content": {"application/gzip": {}}},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "System admin privileges required"},
        404: {"model": ErrorResponse, "description": "Backup not found"},
    },
)
async def download_backup(filename: str, app: AppDep, auth_token: AuthTokenDep) -> FileResponse:
    path = await app.get_backup_path(auth_token, filename)
    return FileResponse(path=path, media_type="application/gzip", filename=filename)


@router.delete(
    "/backups/{filename}",
    summary="Delete backup",
    description="Delete a backup file (admin only).",
    operation_id="deleteBackup",
    status_code=204,
    responses={
        204: {"description": "Backup deleted"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "System admin privileges required"},
        404: {"model": ErrorResponse, "description": "Backup not found"},
    },
)
async def delete_backup(filename: str, app: AppDep, auth_token: AuthTokenDep) -> None:
    await app.delete_backup(auth_token, filename)
