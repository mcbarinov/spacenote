from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from spacenote.config import Config
from spacenote.core.core import Core
from spacenote.core.modules.session.models import AuthToken
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

    async def login(self, user_id: str, password: str) -> AuthToken:
        """Authenticate user and create session."""
        if not self._core.services.user.verify_password(user_id, password):
            raise AuthenticationError
        return await self._core.services.session.create_session(user_id)

    async def logout(self, auth_token: AuthToken) -> None:
        """Invalidate user session."""
        await self._core.services.session.invalidate_session(auth_token)
