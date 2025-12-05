from functools import cached_property
from types import MappingProxyType
from typing import Any

import structlog
from pymongo.asynchronous.collection import AsyncCollection

from spacenote.core.db import Collection
from spacenote.core.modules.user.models import User
from spacenote.core.modules.user.password import hash_password, verify_password_hash
from spacenote.core.modules.user.validators import validate_password, validate_username
from spacenote.core.service import Service
from spacenote.errors import NotFoundError, ValidationError

logger = structlog.get_logger(__name__)


class UserService(Service):
    """Manages users with in-memory cache."""

    def __init__(self) -> None:
        self._users: dict[str, User] = {}

    @cached_property
    def _collection(self) -> AsyncCollection[dict[str, Any]]:
        return self.database.get_collection(Collection.USERS)

    def get_user(self, username: str) -> User:
        """Get user by username from cache."""
        if username not in self._users:
            raise NotFoundError(f"User '{username}' not found")
        return self._users[username]

    def has_user(self, username: str) -> bool:
        """Check if user exists by username."""
        return username in self._users

    def get_all_users(self) -> list[User]:
        """Get all users from cache."""
        return list(self._users.values())

    def get_user_cache(self) -> MappingProxyType[str, User]:
        """Get read-only view of user cache for formatting purposes."""
        return MappingProxyType(self._users)

    async def create_user(self, username: str, password: str) -> User:
        """Create user with hashed password."""
        if self.has_user(username):
            raise ValidationError(f"User '{username}' already exists")

        validate_username(username)
        validate_password(password)
        user = User(username=username, password_hash=hash_password(password))
        await self._collection.insert_one(user.to_mongo())
        return await self.update_user_cache(username)

    def verify_password(self, username: str, password: str) -> bool:
        """Verify password against stored hash."""
        if not self.has_user(username):
            return False
        user = self._users[username]
        return verify_password_hash(password, user.password_hash)

    async def change_password(self, username: str, old_password: str, new_password: str) -> None:
        """Change user password after verifying current password."""
        user = self.get_user(username)
        if not verify_password_hash(old_password, user.password_hash):
            raise ValidationError("Invalid current password")

        validate_password(new_password)
        await self._collection.update_one({"username": username}, {"$set": {"password_hash": hash_password(new_password)}})
        await self.update_user_cache(username)

    async def delete_user(self, username: str) -> None:
        """Delete a user from the system."""
        if not self.has_user(username):
            raise NotFoundError(f"User '{username}' not found")

        if username == "admin":
            raise ValidationError("Cannot delete admin user")

        # TODO: When spaces are implemented, check if user is member of any space
        await self._collection.delete_one({"username": username})
        del self._users[username]

    async def ensure_admin_user_exists(self) -> None:
        """Create default admin user if not exists."""
        if not self.has_user("admin"):
            await self.create_user("admin", "admin")

    async def update_all_users_cache(self) -> None:
        """Reload all users cache from database."""
        users = await User.list_cursor(self._collection.find())
        self._users = {user.username: user for user in users}

    async def update_user_cache(self, username: str) -> User:
        """Reload a specific user cache from database."""
        user = await self._collection.find_one({"username": username})
        if user is None:
            raise NotFoundError(f"User '{username}' not found")
        self._users[username] = User.model_validate(user)
        return self._users[username]

    async def on_start(self) -> None:
        """Initialize indexes, cache, and admin user."""
        # Create unique index on natural key
        await self._collection.create_index([("username", 1)], unique=True)

        await self.update_all_users_cache()
        await self.ensure_admin_user_exists()
        logger.debug("user_service_started", user_count=len(self._users))
