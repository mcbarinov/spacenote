import secrets
from functools import cached_property
from typing import Any

import structlog
from pymongo.asynchronous.collection import AsyncCollection

from spacenote.core.db import Collection
from spacenote.core.modules.session.models import AuthToken, Session
from spacenote.core.modules.user.models import User
from spacenote.core.service import Service
from spacenote.errors import AuthenticationError

logger = structlog.get_logger(__name__)


class SessionService(Service):
    """Manages authentication sessions with in-memory cache."""

    SESSION_TTL_SECONDS = 2592000  # 30 days

    def __init__(self) -> None:
        self._authenticated_users: dict[AuthToken, User] = {}

    @cached_property
    def _collection(self) -> AsyncCollection[dict[str, Any]]:
        return self.database.get_collection(Collection.SESSIONS)

    async def create_session(self, username: str) -> AuthToken:
        """Create new session and return authentication token."""
        auth_token = AuthToken(secrets.token_urlsafe(32))
        session = Session(username=username, auth_token=auth_token)
        await self._collection.insert_one(session.to_mongo())
        logger.debug("session_created", username=username, token_length=len(auth_token))
        return auth_token

    async def get_authenticated_user(self, auth_token: AuthToken) -> User:
        """Get authenticated user by token, checking cache first."""
        if auth_token in self._authenticated_users:
            return self._authenticated_users[auth_token]

        session_doc = await self._collection.find_one({"auth_token": auth_token})
        if session_doc is None:
            raise AuthenticationError("Invalid or expired session")

        session = Session.model_validate(session_doc)

        if not self.core.services.user.has_user(session.username):
            raise AuthenticationError("Invalid or expired session")

        user = self.core.services.user.get_user(session.username)
        self._authenticated_users[auth_token] = user
        return user

    async def is_auth_token_valid(self, auth_token: AuthToken) -> bool:
        """Check if authentication token is valid."""
        try:
            await self.get_authenticated_user(auth_token)
        except AuthenticationError:
            return False
        else:
            return True

    async def invalidate_session(self, auth_token: AuthToken) -> None:
        """Invalidate session by removing from cache and database."""
        self._authenticated_users.pop(auth_token, None)
        await self._collection.delete_one({"auth_token": auth_token})
        logger.debug("session_invalidated")

    async def on_start(self) -> None:
        """Create database indexes on startup."""
        await self._collection.create_index("auth_token", unique=True)
        await self._collection.create_index("username")
        await self._collection.create_index("created_at", expireAfterSeconds=self.SESSION_TTL_SECONDS)
        logger.debug("session_service_started", ttl_seconds=self.SESSION_TTL_SECONDS)
