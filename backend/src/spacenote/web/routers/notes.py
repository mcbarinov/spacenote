from fastapi import APIRouter
from pydantic import BaseModel

from spacenote.core.note.models import Note
from spacenote.web.deps import AppDep, AuthTokenDep

router: APIRouter = APIRouter(tags=["Notes"])


class CreateNoteRequest(BaseModel):
    raw_fields: dict[str, str]


@router.get("/spaces/{space_slug}/notes")
async def list_notes(space_slug: str, app: AppDep, auth_token: AuthTokenDep) -> list[Note]:
    return await app.get_notes_by_space(auth_token, space_slug)


@router.post("/spaces/{space_slug}/notes", status_code=201)
async def create_note(space_slug: str, request: CreateNoteRequest, app: AppDep, auth_token: AuthTokenDep) -> Note:
    return await app.create_note(auth_token, space_slug, request.raw_fields)
