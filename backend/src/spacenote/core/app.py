from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from spacenote.core.config import CoreConfig
from spacenote.core.core import Core
from spacenote.core.errors import AuthenticationError
from spacenote.core.session.models import AuthToken
from spacenote.core.space.models import Space


class App:
    def __init__(self, config: CoreConfig) -> None:
        self._core = Core(config)

    @asynccontextmanager
    async def lifespan(self) -> AsyncGenerator[None]:
        """Application lifespan management - delegates to Core."""
        async with self._core.lifespan():
            yield

    async def login(self, username: str, password: str) -> AuthToken:
        if not self._core.services.user.verify_password(username, password):
            raise AuthenticationError
        return await self._core.services.session.create_session(username)

    async def create_space(self, auth_token: AuthToken, slug: str, title: str) -> Space:
        current_user = await self._core.services.session.get_authenticated_user(auth_token)
        return await self._core.services.space.create_space(slug, title, current_user.id)
