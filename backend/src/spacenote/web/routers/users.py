from fastapi import APIRouter
from pydantic import BaseModel, Field

from spacenote.core.user.models import UserView
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.schemas import ErrorResponse

router = APIRouter(tags=["users"])


class CreateUserRequest(BaseModel):
    """Request to create a new user."""

    username: str = Field(..., min_length=1, description="Username for the new user")
    password: str = Field(..., min_length=1, description="Password for the new user")


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
async def list_users(app: AppDep, auth_token: AuthTokenDep) -> list[UserView]:
    """Get all users."""
    return await app.get_all_users(auth_token)


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
async def get_current_user(app: AppDep, auth_token: AuthTokenDep) -> UserView:
    """Get current authenticated user."""
    return await app.get_current_user(auth_token)


@router.post(
    "/users",
    summary="Create new user",
    description="Create a new user account. Only accessible by admin users.",
    operation_id="createUser",
    responses={
        201: {"description": "User created successfully"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
    },
    status_code=201,
)
async def create_user(create_data: CreateUserRequest, app: AppDep, auth_token: AuthTokenDep) -> UserView:
    """Create a new user (admin only)."""
    return await app.create_user(auth_token, create_data.username, create_data.password)
