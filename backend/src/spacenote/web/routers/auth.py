from fastapi import APIRouter, Response

from spacenote.web.deps import AppDep
from spacenote.web.schemas import LoginRequest, LoginResponse

router = APIRouter(tags=["Authentication"])


@router.post("/auth/login")
async def login(login_data: LoginRequest, app: AppDep, response: Response) -> LoginResponse:
    """Authenticate user and create session."""

    auth_token = await app.login(login_data.username, login_data.password)

    # Set cookie for browser-based testing
    response.set_cookie(
        key="auth_token",
        value=auth_token,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
    )

    return LoginResponse(auth_token=auth_token)
