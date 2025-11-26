from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core.modules.session.models import AuthToken
from spacenote.core.modules.user.models import User
from spacenote.core.service import Service
from spacenote.errors import AccessDeniedError


class AccessService(Service):
    """Centralized access control and permission management."""

    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)

    async def ensure_authenticated(self, auth_token: AuthToken) -> User:
        """Verify user is authenticated."""
        return await self.core.services.session.get_authenticated_user(auth_token)

    async def ensure_admin(self, auth_token: AuthToken) -> User:
        """Verify user has admin privileges."""
        user = await self.core.services.session.get_authenticated_user(auth_token)
        if user.username != "admin":
            raise AccessDeniedError("Admin privileges required")
        return user

    async def ensure_space_member(self, auth_token: AuthToken, space_slug: str) -> User:
        """Verify user is a member of the specified space."""
        user = await self.core.services.session.get_authenticated_user(auth_token)
        space = self.core.services.space.get_space(space_slug)
        if user.username not in space.members:
            raise AccessDeniedError("Not a member of this space")
        return user
