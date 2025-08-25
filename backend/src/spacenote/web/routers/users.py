from fastapi import APIRouter

from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.schemas import ErrorResponse, User

router = APIRouter(tags=["users"])


@router.get(
    "/users",
    summary="List all users",
    description="Get all users in the system. Requires authentication.",
    operation_id="listUsers",
    responses={
        200: {"description": "List of all users"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
    },
)
async def list_users(app: AppDep, auth_token: AuthTokenDep) -> list[User]:
    """Get all users."""
    users = await app.get_all_users(auth_token)
    return [User.from_core(user) for user in users]


@router.get(
    "/users/me",
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
