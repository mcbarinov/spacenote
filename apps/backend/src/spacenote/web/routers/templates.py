from fastapi import APIRouter
from pydantic import BaseModel, Field

from spacenote.core.modules.space.models import Space
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.openapi import ErrorResponse

router = APIRouter(tags=["templates"])


class SetTemplateRequest(BaseModel):
    """Set template request."""

    content: str = Field(..., description="Liquid template content")


TEMPLATE_KEYS_DOC = """
Valid template keys:
- `note.title` — note title (Liquid template, default: "Note #{{ note.number }}")
- `web:note:detail` — note detail view
- `web:note:list:{filter}` — note list for a filter (e.g., `web:note:list:all`)

Empty content removes the template.
"""


@router.put(
    "/spaces/{slug}/templates/{key}",
    summary="Set space template",
    description="Set a Liquid template for the space. Admin only.\n" + TEMPLATE_KEYS_DOC,
    operation_id="setSpaceTemplate",
    responses={
        200: {"description": "Template set successfully"},
        400: {"model": ErrorResponse, "description": "Invalid template key"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def set_space_template(slug: str, key: str, request: SetTemplateRequest, app: AppDep, auth_token: AuthTokenDep) -> Space:
    """Set or remove template for space (admin only). Empty content removes the template."""
    return await app.set_space_template(auth_token, slug, key, request.content)
