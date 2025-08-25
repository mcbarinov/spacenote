from fastapi import APIRouter, Response

from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.schemas import ErrorResponse, LoginRequest, LoginResponse, User

router = APIRouter(tags=["auth"])


@router.post(
    "/auth/login",
    summary="Authenticate user",
    description="Authenticate with username and password to receive an authentication token.",
    operation_id="login",
    responses={
        200: {"description": "Successfully authenticated"},
        401: {"model": ErrorResponse, "description": "Invalid credentials"},
    },
)
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


@router.post(
    "/auth/logout",
    summary="End session",
    description="Invalidate the current authentication session.",
    operation_id="logout",
    responses={
        200: {"description": "Successfully logged out"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
    },
)
async def logout(app: AppDep, auth_token: AuthTokenDep, response: Response) -> dict[str, str]:
    """Logout and invalidate session."""
    await app.logout(auth_token)
    response.delete_cookie("auth_token")
    return {"message": "Logged out successfully"}


@router.get(
    "/auth/me",
    summary="Get current user",
    description="Get information about the currently authenticated user.",
    operation_id="getCurrentUser",
    responses={
        200: {"description": "Current user information"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
    },
)
async def get_current_user(app: AppDep, auth_token: AuthTokenDep) -> User:
    """Get current authenticated user."""
    user = await app.get_current_user(auth_token)
    return User.from_core(user)
