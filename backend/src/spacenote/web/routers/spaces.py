from fastapi import APIRouter
from pydantic import BaseModel

from spacenote.core.space.models import Space
from spacenote.web.deps import AppDep, AuthTokenDep

router: APIRouter = APIRouter(tags=["Spaces"])


class CreateSpaceRequest(BaseModel):
    slug: str
    title: str


@router.get("/spaces")
async def list_spaces(app: AppDep, auth_token: AuthTokenDep) -> list[Space]:
    return await app.get_spaces_by_member(auth_token)


@router.post("/spaces", status_code=201)
async def create_space(req: CreateSpaceRequest, app: AppDep, auth_token: AuthTokenDep) -> Space:
    return await app.create_space(auth_token, req.slug, req.title)
