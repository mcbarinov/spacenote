from fastapi import APIRouter
from fastapi.responses import FileResponse

from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.openapi import ErrorResponse

router = APIRouter(tags=["images"])


@router.get(
    "/spaces/{space_slug}/notes/{note_number}/images/{field_name}",
    summary="Download image",
    description="Download pre-generated WebP image for an IMAGE field.",
    operation_id="downloadImage",
    responses={
        200: {"description": "Image (WebP format)"},
        202: {"model": ErrorResponse, "description": "Image is still processing"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space, note, field, or image not found"},
    },
)
async def download_image(
    space_slug: str, note_number: int, field_name: str, app: AppDep, auth_token: AuthTokenDep
) -> FileResponse:
    path = await app.get_image_path(auth_token, space_slug, note_number, field_name)
    return FileResponse(path=path, media_type="image/webp")
