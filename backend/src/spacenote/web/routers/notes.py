from fastapi import APIRouter

from spacenote.core.note.models import Note
from spacenote.web.deps import AppDep, AuthTokenDep

router: APIRouter = APIRouter(tags=["Notes"])


@router.get("/spaces/{space_slug}/notes")
async def list_notes(space_slug: str, app: AppDep, auth_token: AuthTokenDep) -> list[Note]:
    return await app.get_notes_by_space(auth_token, space_slug)