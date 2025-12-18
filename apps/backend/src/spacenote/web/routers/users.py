from fastapi import APIRouter
from pydantic import BaseModel, Field

from spacenote.core.modules.user.models import UserView
from spacenote.web.deps import AppDep, AuthTokenDep
from spacenote.web.openapi import ErrorResponse

router = APIRouter(tags=["users"])


class CreateUserRequest(BaseModel):
    """User creation request."""

    username: str = Field(..., min_length=1, description="Username for the new user")
    password: str = Field(..., min_length=1, description="Password for the new user")


@router.get(
    "/users",
    summary="List all users",
    description="Get all users in the system",
    operation_id="listUsers",
    responses={
        200: {"description": "List of all users"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
    },
)
async def list_users(app: AppDep, auth_token: AuthTokenDep) -> list[UserView]:
    """List all users (requires authentication)."""
    return await app.list_users(auth_token)


@router.post(
    "/users",
    summary="Create new user",
    description="Create a new user account. Only accessible by admin users.",
    operation_id="createUser",
    status_code=201,
    responses={
        201: {"description": "User created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
    },
)
async def create_user(create_data: CreateUserRequest, app: AppDep, auth_token: AuthTokenDep) -> UserView:
    """Create new user (admin only)."""
    return await app.create_user(auth_token, create_data.username, create_data.password)


@router.delete(
    "/users/{username}",
    summary="Delete user",
    description="Delete a user account. Only accessible by admin users.",
    operation_id="deleteUser",
    status_code=204,
    responses={
        204: {"description": "User deleted successfully"},
        400: {"model": ErrorResponse, "description": "Cannot delete user (self-deletion)"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
)
async def delete_user(username: str, app: AppDep, auth_token: AuthTokenDep) -> None:
    """Delete user (admin only)."""
    await app.delete_user(auth_token, username)


class SetPasswordRequest(BaseModel):
    """Set password request."""

    password: str = Field(..., min_length=1, description="New password")


@router.put(
    "/users/{username}/password",
    summary="Set user password",
    description="Set password for any user. Only accessible by admin users.",
    operation_id="setUserPassword",
    status_code=204,
    responses={
        204: {"description": "Password set successfully"},
        400: {"model": ErrorResponse, "description": "Invalid password"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        403: {"model": ErrorResponse, "description": "Admin privileges required"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
)
async def set_password(username: str, request: SetPasswordRequest, app: AppDep, auth_token: AuthTokenDep) -> None:
    """Set user password (admin only)."""
    await app.set_password(auth_token, username, request.password)
