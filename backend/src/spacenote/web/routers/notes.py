from fastapi import APIRouter

from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.schemas import CreateNoteRequest, Note

router: APIRouter = APIRouter(tags=["Notes"])


@router.get("/spaces/{space_slug}/notes")
async def list_notes(space_slug: str, app: AppDep, auth_token: AuthTokenDep) -> list[Note]:
    notes = await app.get_notes_by_space(auth_token, space_slug)
    return [Note.from_core(note) for note in notes]


@router.get("/spaces/{space_slug}/notes/{number}")
async def get_note_by_number(space_slug: str, number: int, app: AppDep, auth_token: AuthTokenDep) -> Note:
    note = await app.get_note_by_number(auth_token, space_slug, number)
    return Note.from_core(note)


@router.post("/spaces/{space_slug}/notes", status_code=201)
async def create_note(space_slug: str, request: CreateNoteRequest, app: AppDep, auth_token: AuthTokenDep) -> Note:
    note = await app.create_note(auth_token, space_slug, request.raw_fields)
    return Note.from_core(note)
