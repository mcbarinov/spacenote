import secrets
from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core.core import Service
from spacenote.core.session.models import AuthToken, Session


class SessionService(Service):
    """Service for managing user sessions."""

    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)
        self._collection = database.get_collection("sessions")
        # self._session_cache: dict[SessionId, User] = {}

    async def create_session(self, username: str) -> AuthToken:
        user = self.core.services.user.get_user_by_username(username)
        auth_token = AuthToken(secrets.token_urlsafe(32))
        new_session = Session(user_id=user.id, auth_token=auth_token)
        await self._collection.insert_one(new_session.to_mongo_dict())
        return auth_token
