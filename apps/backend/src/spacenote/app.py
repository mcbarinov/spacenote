from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from spacenote.config import Config
from spacenote.core.core import Core
from spacenote.core.modules.field.models import SpaceField
from spacenote.core.modules.note.models import Note
from spacenote.core.modules.session.models import AuthToken
from spacenote.core.modules.space.models import Space
from spacenote.core.modules.user.models import UserView
from spacenote.core.pagination import PaginationResult
from spacenote.errors import AuthenticationError


class App:
    """Facade for all application operations, validates permissions before delegating to Core."""

    def __init__(self, config: Config) -> None:
        self._core = Core(config)

    @asynccontextmanager
    async def lifespan(self) -> AsyncGenerator[None]:
        """Application lifespan management - delegates to Core."""
        async with self._core.lifespan():
            yield

    async def check_database_health(self) -> bool:
        """Check if database is available (no authentication required)."""
        return await self._core.check_database_health()

    async def is_auth_token_valid(self, auth_token: AuthToken) -> bool:
        """Check if authentication token is valid."""
        return await self._core.services.session.is_auth_token_valid(auth_token)

    async def login(self, username: str, password: str) -> AuthToken:
        """Authenticate user and create session."""
        if not self._core.services.user.verify_password(username, password):
            raise AuthenticationError
        return await self._core.services.session.create_session(username)

    async def logout(self, auth_token: AuthToken) -> None:
        """Invalidate user session."""
        await self._core.services.session.invalidate_session(auth_token)

    async def get_current_user(self, auth_token: AuthToken) -> UserView:
        """Get current authenticated user profile."""
        user = await self._core.services.access.ensure_authenticated(auth_token)
        return UserView.from_domain(user)

    async def change_password(self, auth_token: AuthToken, old_password: str, new_password: str) -> None:
        """Change password for the current authenticated user."""
        user = await self._core.services.access.ensure_authenticated(auth_token)
        await self._core.services.user.change_password(user.username, old_password, new_password)

    async def get_all_users(self, auth_token: AuthToken) -> list[UserView]:
        """Get all users (requires authentication)."""
        await self._core.services.access.ensure_authenticated(auth_token)
        users = self._core.services.user.get_all_users()
        return [UserView.from_domain(user) for user in users]

    async def create_user(self, auth_token: AuthToken, username: str, password: str) -> UserView:
        """Create new user (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        user = await self._core.services.user.create_user(username, password)
        return UserView.from_domain(user)

    async def delete_user(self, auth_token: AuthToken, username: str) -> None:
        """Delete user (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        await self._core.services.user.delete_user(username)

    async def get_spaces(self, auth_token: AuthToken) -> list[Space]:
        """Get spaces - all for admin, only member spaces for users."""
        user = await self._core.services.access.ensure_authenticated(auth_token)

        if user.username == "admin":
            return self._core.services.space.get_all_spaces()
        return self._core.services.space.get_user_spaces(user.username)

    async def create_space(self, auth_token: AuthToken, slug: str, title: str, description: str, members: list[str]) -> Space:
        """Create new space (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.space.create_space(slug, title, description, members)

    async def update_space_title(self, auth_token: AuthToken, slug: str, title: str) -> Space:
        """Update space title (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.space.update_title(slug, title)

    async def update_space_description(self, auth_token: AuthToken, slug: str, description: str) -> Space:
        """Update space description (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.space.update_description(slug, description)

    async def update_space_members(self, auth_token: AuthToken, slug: str, members: list[str]) -> Space:
        """Update space members (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.space.update_members(slug, members)

    async def delete_space(self, auth_token: AuthToken, slug: str) -> None:
        """Delete space (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        await self._core.services.space.delete_space(slug)

    async def add_field_to_space(self, auth_token: AuthToken, slug: str, field: SpaceField) -> Space:
        """Add field to space (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        await self._core.services.field.add_field_to_space(slug, field)
        return self._core.services.space.get_space(slug)

    async def remove_field_from_space(self, auth_token: AuthToken, slug: str, field_name: str) -> None:
        """Remove field from space (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        await self._core.services.field.remove_field_from_space(slug, field_name)

    async def get_notes(self, auth_token: AuthToken, space_slug: str, limit: int = 50, offset: int = 0) -> PaginationResult[Note]:
        """Get paginated notes in space (members only)."""
        await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.note.list_notes(space_slug, limit, offset)

    async def get_note(self, auth_token: AuthToken, space_slug: str, number: int) -> Note:
        """Get specific note by number (members only)."""
        await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.note.get_note(space_slug, number)

    async def create_note(self, auth_token: AuthToken, space_slug: str, raw_fields: dict[str, str]) -> Note:
        """Create note with custom fields (members only)."""
        user = await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.note.create_note(space_slug, user.username, raw_fields)

    async def update_note(self, auth_token: AuthToken, space_slug: str, number: int, raw_fields: dict[str, str]) -> Note:
        """Update specific note fields (partial update, members only)."""
        user = await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.note.update_note_fields(space_slug, number, raw_fields, user.username)
