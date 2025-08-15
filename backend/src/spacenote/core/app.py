from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from spacenote.core.config import CoreConfig
from spacenote.core.core import Core
from spacenote.core.errors import AuthenticationError
from spacenote.core.session.models import AuthToken


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
