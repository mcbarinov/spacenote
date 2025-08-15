from fastapi import APIRouter

from spacenote.core.space.models import Space
from spacenote.web.deps import AppDep, AuthTokenDep

router: APIRouter = APIRouter(tags=["Spaces"])


@router.get("/spaces")
async def list_spaces(app: AppDep, auth_token: AuthTokenDep) -> list[Space]:
    return await app.get_spaces_by_member(auth_token)
