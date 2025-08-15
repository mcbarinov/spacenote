import secrets
from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core.core import Service
from spacenote.core.errors import AuthenticationError
from spacenote.core.session.models import AuthToken, Session
from spacenote.core.user.models import User


class SessionService(Service):
    """Service for managing user sessions."""

    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)
        self._collection = database.get_collection("sessions")
        self._authenticated_users: dict[AuthToken, User] = {}

    async def create_session(self, username: str) -> AuthToken:
        user = self.core.services.user.get_user_by_username(username)
        auth_token = AuthToken(secrets.token_urlsafe(32))
        new_session = Session(user_id=user.id, auth_token=auth_token)
        await self._collection.insert_one(new_session.to_mongo_dict())
        return auth_token

    async def get_authenticated_user_or_none(self, auth_token: AuthToken) -> User | None:
        # Check cache first
        if auth_token in self._authenticated_users:
            return self._authenticated_users[auth_token]

        # Get session from database
        session = await self._collection.find_one({"auth_token": auth_token})
        if session is None:
            return None

        if self.core.services.user.has_user(session["user_id"]):
            return self.core.services.user.get_user(session["user_id"])

    async def get_authenticated_user(self, auth_token: AuthToken) -> User:
        user = await self.get_authenticated_user_or_none(auth_token)
        if user is None:
            raise AuthenticationError("Invalid or expired session")
        return user
