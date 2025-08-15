from fastapi import APIRouter
from pydantic import BaseModel

from spacenote.web.deps import AppDep

router = APIRouter(tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    auth_token: str


@router.post("/auth/login")
async def login(login_data: LoginRequest, app: AppDep) -> LoginResponse:
    """Authenticate user and create session."""

    auth_token = await app.login(login_data.username, login_data.password)
    return LoginResponse(auth_token=auth_token)
