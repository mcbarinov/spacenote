from typing import Annotated

from fastapi import APIRouter, Query, UploadFile
from fastapi.responses import Response

from spacenote.core.modules.attachment.models import Attachment, PendingAttachment
from spacenote.core.modules.image.processor import parse_webp_option
from spacenote.errors import ValidationError
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.openapi import ErrorResponse

router = APIRouter(tags=["attachments"])


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
) -> PendingAttachment:
    content = await file.read()
    return await app.upload_pending_attachment(
        auth_token,
        filename=file.filename or "unnamed",
        content=content,
        mime_type=file.content_type or "application/octet-stream",
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
) -> Attachment:
    content = await file.read()
    return await app.upload_space_attachment(
        auth_token,
        space_slug,
        filename=file.filename or "unnamed",
        content=content,
        mime_type=file.content_type or "application/octet-stream",
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
) -> Attachment:
    content = await file.read()
    return await app.upload_note_attachment(
        auth_token,
        space_slug,
        note_number,
        filename=file.filename or "unnamed",
        content=content,
        mime_type=file.content_type or "application/octet-stream",
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
) -> list[Attachment]:
    return await app.list_space_attachments(auth_token, space_slug)


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
) -> list[Attachment]:
    return await app.list_note_attachments(auth_token, space_slug, note_number)


@router.get(
    "/attachments/pending/{number}",
    summary="Download pending attachment",
    description=(
        "Download a pending attachment file. Only the owner can download. "
        "Use `?format=webp` to convert images to WebP. "
        "Optional `&option=max_width:800` to resize."
    ),
    operation_id="downloadPendingAttachment",
    responses={
        200: {"description": "File content", "content": {"application/octet-stream": {}}},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not the owner of this attachment"},
        404: {"model": ErrorResponse, "description": "Attachment not found"},
    },
)
async def download_pending_attachment(
    number: int,
    app: AppDep,
    auth_token: AuthTokenDep,
    output_format: Annotated[str | None, Query(alias="format")] = None,
    option: str | None = None,
) -> Response:
    if output_format is not None and output_format != "webp":
        raise ValidationError(f"Unsupported format: {output_format}")

    if output_format == "webp":
        options = parse_webp_option(option)
        webp_data = await app.get_attachment_as_webp(auth_token, None, None, number, options)
        return Response(content=webp_data, media_type="image/webp")

    pending, content = await app.download_pending_attachment(auth_token, number)
    return Response(
        content=content,
        media_type=pending.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{pending.filename}"'},
    )


@router.get(
    "/spaces/{space_slug}/attachments/{number}",
    summary="Download space attachment",
    description=(
        "Download a space-level attachment file. "
        "Use `?format=webp` to convert images to WebP. "
        "Optional `&option=max_width:800` to resize."
    ),
    operation_id="downloadSpaceAttachment",
    responses={
        200: {"description": "File content", "content": {"application/octet-stream": {}}},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space or attachment not found"},
    },
)
async def download_space_attachment(
    space_slug: str,
    number: int,
    app: AppDep,
    auth_token: AuthTokenDep,
    output_format: Annotated[str | None, Query(alias="format")] = None,
    option: str | None = None,
) -> Response:
    if output_format is not None and output_format != "webp":
        raise ValidationError(f"Unsupported format: {output_format}")

    if output_format == "webp":
        options = parse_webp_option(option)
        webp_data = await app.get_attachment_as_webp(auth_token, space_slug, None, number, options)
        return Response(content=webp_data, media_type="image/webp")

    attachment, content = await app.download_space_attachment(auth_token, space_slug, number)
    return Response(
        content=content,
        media_type=attachment.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{attachment.filename}"'},
    )


@router.get(
    "/spaces/{space_slug}/notes/{note_number}/attachments/{number}",
    summary="Download note attachment",
    description=(
        "Download an attachment file from a specific note. "
        "Use `?format=webp` to convert images to WebP. "
        "Optional `&option=max_width:800` to resize."
    ),
    operation_id="downloadNoteAttachment",
    responses={
        200: {"description": "File content", "content": {"application/octet-stream": {}}},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space, note, or attachment not found"},
    },
)
async def download_note_attachment(
    space_slug: str,
    note_number: int,
    number: int,
    app: AppDep,
    auth_token: AuthTokenDep,
    output_format: Annotated[str | None, Query(alias="format")] = None,
    option: str | None = None,
) -> Response:
    if output_format is not None and output_format != "webp":
        raise ValidationError(f"Unsupported format: {output_format}")

    if output_format == "webp":
        options = parse_webp_option(option)
        webp_data = await app.get_attachment_as_webp(auth_token, space_slug, note_number, number, options)
        return Response(content=webp_data, media_type="image/webp")

    attachment, content = await app.download_note_attachment(auth_token, space_slug, note_number, number)
    return Response(
        content=content,
        media_type=attachment.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{attachment.filename}"'},
    )
