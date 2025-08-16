from fastapi import APIRouter
from pydantic import BaseModel

from spacenote.core.field.models import SpaceField
from spacenote.core.space.models import Space
from spacenote.web.deps import AppDep, AuthTokenDep

router: APIRouter = APIRouter(tags=["Spaces"])


class CreateSpaceRequest(BaseModel):
    slug: str
    title: str


class AddFieldRequest(BaseModel):
    field: SpaceField


@router.get("/spaces")
async def list_spaces(app: AppDep, auth_token: AuthTokenDep) -> list[Space]:
    return await app.get_spaces_by_member(auth_token)


@router.post("/spaces", status_code=201)
async def create_space(req: CreateSpaceRequest, app: AppDep, auth_token: AuthTokenDep) -> Space:
    return await app.create_space(auth_token, req.slug, req.title)


@router.post("/spaces/{space_slug}/fields")
async def add_field_to_space(space_slug: str, req: AddFieldRequest, app: AppDep, auth_token: AuthTokenDep) -> Space:
    return await app.add_field_to_space(auth_token, space_slug, req.field)
