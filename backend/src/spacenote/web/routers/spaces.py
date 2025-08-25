from fastapi import APIRouter
from pydantic import BaseModel

from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.schemas import Space, SpaceField

router: APIRouter = APIRouter(tags=["Spaces"])


class CreateSpaceRequest(BaseModel):
    slug: str
    title: str


@router.get("/spaces")
async def list_spaces(app: AppDep, auth_token: AuthTokenDep) -> list[Space]:
    spaces = await app.get_spaces_by_member(auth_token)
    return [Space.from_core(space) for space in spaces]


@router.post("/spaces", status_code=201)
async def create_space(req: CreateSpaceRequest, app: AppDep, auth_token: AuthTokenDep) -> Space:
    space = await app.create_space(auth_token, req.slug, req.title)
    return Space.from_core(space)


@router.post("/spaces/{space_slug}/fields")
async def add_field_to_space(space_slug: str, field: SpaceField, app: AppDep, auth_token: AuthTokenDep) -> Space:
    space = await app.add_field_to_space(auth_token, space_slug, field)
    return Space.from_core(space)
