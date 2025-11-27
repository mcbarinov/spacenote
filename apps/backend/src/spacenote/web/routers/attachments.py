from datetime import datetime

from fastapi import APIRouter, UploadFile
from pydantic import BaseModel

from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.openapi import ErrorResponse

router = APIRouter(tags=["attachments"])


class PendingAttachmentResponse(BaseModel):
    """Response for pending attachment upload."""

    number: int
    filename: str
    size: int
    mime_type: str
    created_at: datetime


class AttachmentResponse(BaseModel):
    """Response for attachment upload."""

    space_slug: str
    note_number: int | None
    number: int
    filename: str
    size: int
    mime_type: str
    created_at: datetime


@router.post(
    "/attachments/pending",
    summary="Upload pending attachment",
    description="Upload a file to pending storage. Must be finalized when creating/updating a note.",
    operation_id="uploadPendingAttachment",
    status_code=201,
    responses={
        201: {"description": "File uploaded successfully"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
    },
)
async def upload_pending(
    file: UploadFile,
    app: AppDep,
    auth_token: AuthTokenDep,
) -> PendingAttachmentResponse:
    content = await file.read()
    pending = await app.upload_pending_attachment(
        auth_token,
        filename=file.filename or "unnamed",
        content=content,
        mime_type=file.content_type or "application/octet-stream",
    )
    return PendingAttachmentResponse(
        number=pending.number,
        filename=pending.filename,
        size=pending.size,
        mime_type=pending.mime_type,
        created_at=pending.created_at,
    )


@router.post(
    "/spaces/{space_slug}/attachments",
    summary="Upload space attachment",
    description="Upload a file directly to space (e.g. AI context documents).",
    operation_id="uploadSpaceAttachment",
    status_code=201,
    responses={
        201: {"description": "File uploaded successfully"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def upload_space_attachment(
    space_slug: str,
    file: UploadFile,
    app: AppDep,
    auth_token: AuthTokenDep,
) -> AttachmentResponse:
    content = await file.read()
    attachment = await app.upload_space_attachment(
        auth_token,
        space_slug,
        filename=file.filename or "unnamed",
        content=content,
        mime_type=file.content_type or "application/octet-stream",
    )
    return AttachmentResponse(
        space_slug=attachment.space_slug,
        note_number=attachment.note_number,
        number=attachment.number,
        filename=attachment.filename,
        size=attachment.size,
        mime_type=attachment.mime_type,
        created_at=attachment.created_at,
    )


@router.post(
    "/spaces/{space_slug}/notes/{note_number}/attachments",
    summary="Upload note attachment",
    description="Upload a file directly to a note.",
    operation_id="uploadNoteAttachment",
    status_code=201,
    responses={
        201: {"description": "File uploaded successfully"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space or note not found"},
    },
)
async def upload_note_attachment(
    space_slug: str,
    note_number: int,
    file: UploadFile,
    app: AppDep,
    auth_token: AuthTokenDep,
) -> AttachmentResponse:
    content = await file.read()
    attachment = await app.upload_note_attachment(
        auth_token,
        space_slug,
        note_number,
        filename=file.filename or "unnamed",
        content=content,
        mime_type=file.content_type or "application/octet-stream",
    )
    return AttachmentResponse(
        space_slug=attachment.space_slug,
        note_number=attachment.note_number,
        number=attachment.number,
        filename=attachment.filename,
        size=attachment.size,
        mime_type=attachment.mime_type,
        created_at=attachment.created_at,
    )


@router.get(
    "/spaces/{space_slug}/attachments",
    summary="List space attachments",
    description="List all space-level attachments (e.g. AI context documents).",
    operation_id="listSpaceAttachments",
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def list_space_attachments(
    space_slug: str,
    app: AppDep,
    auth_token: AuthTokenDep,
) -> list[AttachmentResponse]:
    attachments = await app.get_space_attachments(auth_token, space_slug)
    return [
        AttachmentResponse(
            space_slug=a.space_slug,
            note_number=a.note_number,
            number=a.number,
            filename=a.filename,
            size=a.size,
            mime_type=a.mime_type,
            created_at=a.created_at,
        )
        for a in attachments
    ]


@router.get(
    "/spaces/{space_slug}/notes/{note_number}/attachments",
    summary="List note attachments",
    description="List all attachments for a specific note.",
    operation_id="listNoteAttachments",
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space or note not found"},
    },
)
async def list_note_attachments(
    space_slug: str,
    note_number: int,
    app: AppDep,
    auth_token: AuthTokenDep,
) -> list[AttachmentResponse]:
    attachments = await app.get_note_attachments(auth_token, space_slug, note_number)
    return [
        AttachmentResponse(
            space_slug=a.space_slug,
            note_number=a.note_number,
            number=a.number,
            filename=a.filename,
            size=a.size,
            mime_type=a.mime_type,
            created_at=a.created_at,
        )
        for a in attachments
    ]
