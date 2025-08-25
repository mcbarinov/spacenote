from fastapi import APIRouter

from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.schemas import CreateNoteRequest, ErrorResponse, Note

router: APIRouter = APIRouter(tags=["notes"])


@router.get(
    "/spaces/{space_slug}/notes",
    summary="List space notes",
    description="Get all notes in a space. Only space members can view notes.",
    operation_id="listNotes",
    responses={
        200: {"description": "List of notes"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def list_notes(space_slug: str, app: AppDep, auth_token: AuthTokenDep) -> list[Note]:
    notes = await app.get_notes_by_space(auth_token, space_slug)
    return [Note.from_core(note) for note in notes]


@router.get(
    "/spaces/{space_slug}/notes/{number}",
    summary="Get note by number",
    description="Get a specific note by its number within a space. Only space members can view notes.",
    operation_id="getNote",
    responses={
        200: {"description": "Note details"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space or note not found"},
    },
)
async def get_note_by_number(space_slug: str, number: int, app: AppDep, auth_token: AuthTokenDep) -> Note:
    note = await app.get_note_by_number(auth_token, space_slug, number)
    return Note.from_core(note)


@router.post(
    "/spaces/{space_slug}/notes",
    summary="Create new note",
    description="Create a new note in a space with the provided field values. Only space members can create notes.",
    operation_id="createNote",
    status_code=201,
    responses={
        201: {"description": "Note created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid field data or validation failed"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Not a member of this space"},
        404: {"model": ErrorResponse, "description": "Space not found"},
    },
)
async def create_note(space_slug: str, request: CreateNoteRequest, app: AppDep, auth_token: AuthTokenDep) -> Note:
    note = await app.create_note(auth_token, space_slug, request.raw_fields)
    return Note.from_core(note)
