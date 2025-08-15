from typing import Any

import bcrypt
import structlog
from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core.core import Service
from spacenote.core.errors import NotFoundError, ValidationError
from spacenote.core.user.models import User

logger = structlog.get_logger(__name__)


class UserService(Service):
    """Service for managing users with in-memory caching."""

    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)
        self._collection = database.get_collection("users")
        self._users: dict[ObjectId, User] = {}

    def get_user(self, id: ObjectId) -> User:
        """Get user by ID from cache."""
        if id not in self._users:
            raise NotFoundError(f"User '{id}' not found")
        return self._users[id]

    def get_user_by_username(self, username: str) -> User:
        """Get user by username from cache."""
        user = next((u for u in self._users.values() if u.username == username), None)
        if user is None:
            raise NotFoundError(f"User '{username}' not found")
        return user

    def has_user(self, id: ObjectId) -> bool:
        """Check if a user exists by ID."""
        return id in self._users

    def has_username(self, username: str) -> bool:
        """Check if a user exists by username."""
        return any(user.username == username for user in self._users.values())

    async def create_user(self, username: str, password: str) -> User:
        """Create a new user with hashed password."""
        if self.has_username(username):
            raise ValidationError(f"User '{username}' already exists")

        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        new_user = User(username=username, password_hash=password_hash)
        id = (await self._collection.insert_one(new_user.to_mongo_dict())).inserted_id
        await self.update_cache(id)
        return self.get_user(id)

    def verify_password(self, username: str, password: str) -> bool:
        """Verify user password."""
        user = next((u for u in self._users.values() if u.username == username), None)
        if user is None:
            return False
        return bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8"))

    async def ensure_admin_user_exists(self) -> None:
        if not self.has_username("admin"):
            await self.create_user("admin", "admin")

    async def update_cache(self, id: ObjectId | None = None) -> None:
        """Reload users cache from database."""
        if id is not None:  # update a specific user
            user = await self._collection.find_one({"_id": id})
            if user is None:
                del self._users[id]
            self._users[id] = User.model_validate(user)
        else:  # update all users
            users = await User.list_cursor(self._collection.find())
            self._users = {user.id: user for user in users}

    async def on_start(self) -> None:
        """Initialize service on application startup."""
        await self.update_cache()
        await self.ensure_admin_user_exists()
        logger.debug("user_service_started", user_count=len(self._users))
