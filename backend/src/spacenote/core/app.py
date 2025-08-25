from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from spacenote.core.config import CoreConfig
from spacenote.core.core import Core
from spacenote.core.errors import AuthenticationError
from spacenote.core.field.models import SpaceField
from spacenote.core.note.models import Note
from spacenote.core.session.models import AuthToken
from spacenote.core.space.models import Space
from spacenote.core.user.models import User


class App:
    def __init__(self, config: CoreConfig) -> None:
        self._core = Core(config)

    @asynccontextmanager
    async def lifespan(self) -> AsyncGenerator[None]:
        """Application lifespan management - delegates to Core."""
        async with self._core.lifespan():
            yield

    async def is_auth_token_valid(self, auth_token: AuthToken) -> bool:
        user = await self._core.services.session.get_authenticated_user_or_none(auth_token)
        return user is not None

    async def login(self, username: str, password: str) -> AuthToken:
        if not self._core.services.user.verify_password(username, password):
            raise AuthenticationError
        return await self._core.services.session.create_session(username)

    async def logout(self, auth_token: AuthToken) -> None:
        await self._core.services.session.invalidate_session(auth_token)

    async def get_current_user(self, auth_token: AuthToken) -> User:
        return await self._core.services.session.get_authenticated_user(auth_token)

    async def get_spaces_by_member(self, auth_token: AuthToken) -> list[Space]:
        current_user = await self._core.services.session.get_authenticated_user(auth_token)
        return self._core.services.space.get_spaces_by_member(current_user.id)

    async def create_space(self, auth_token: AuthToken, slug: str, title: str) -> Space:
        current_user = await self._core.services.session.get_authenticated_user(auth_token)
        return await self._core.services.space.create_space(slug, title, current_user.id)

    async def add_field_to_space(self, auth_token: AuthToken, space_slug: str, field: SpaceField) -> Space:
        space = self._core.services.space.get_space_by_slug(space_slug)
        await self._core.services.access.ensure_space_member(auth_token, space.id)

        return await self._core.services.space.add_field(space.id, field)

    async def get_notes_by_space(self, auth_token: AuthToken, space_slug: str) -> list[Note]:
        space = self._core.services.space.get_space_by_slug(space_slug)
        await self._core.services.access.ensure_space_member(auth_token, space.id)

        return await self._core.services.note.list_notes(space.id)

    async def get_note_by_number(self, auth_token: AuthToken, space_slug: str, number: int) -> Note:
        space = self._core.services.space.get_space_by_slug(space_slug)
        await self._core.services.access.ensure_space_member(auth_token, space.id)

        return await self._core.services.note.get_note_by_number(space.id, number)

    async def create_note(self, auth_token: AuthToken, space_slug: str, raw_fields: dict[str, str]) -> Note:
        space = self._core.services.space.get_space_by_slug(space_slug)
        await self._core.services.access.ensure_space_member(auth_token, space.id)

        current_user = await self._core.services.session.get_authenticated_user(auth_token)
        return await self._core.services.note.create_note(space.id, current_user.id, raw_fields)
