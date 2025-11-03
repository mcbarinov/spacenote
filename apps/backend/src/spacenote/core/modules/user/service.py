from types import MappingProxyType
from typing import Any

import structlog
from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core.modules.user.models import User
from spacenote.core.modules.user.password import hash_password, verify_password_hash
from spacenote.core.modules.user.validators import validate_password, validate_user_id
from spacenote.core.service import Service
from spacenote.errors import NotFoundError, ValidationError

logger = structlog.get_logger(__name__)


class UserService(Service):
    """Manages users with in-memory cache."""

    COLLECTION_NAME = "users"

    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)
        self._collection = database.get_collection(self.COLLECTION_NAME)
        self._users: dict[str, User] = {}

    def get_user(self, user_id: str) -> User:
        """Get user by ID from cache."""
        if user_id not in self._users:
            raise NotFoundError(f"User '{user_id}' not found")
        return self._users[user_id]

    def has_user(self, user_id: str) -> bool:
        """Check if user exists by ID."""
        return user_id in self._users

    def get_all_users(self) -> list[User]:
        """Get all users from cache."""
        return list(self._users.values())

    def get_user_cache(self) -> MappingProxyType[str, User]:
        """Get read-only view of user cache for formatting purposes."""
        return MappingProxyType(self._users)

    async def create_user(self, user_id: str, password: str) -> User:
        """Create user with hashed password."""
        if self.has_user(user_id):
            raise ValidationError(f"User '{user_id}' already exists")

        validate_user_id(user_id)
        validate_password(password)
        user = User(id=user_id, password_hash=hash_password(password))
        await self._collection.insert_one(user.to_mongo())
        return await self.update_user_cache(user_id)

    def verify_password(self, user_id: str, password: str) -> bool:
        """Verify password against stored hash."""
        if not self.has_user(user_id):
            return False
        user = self._users[user_id]
        return verify_password_hash(password, user.password_hash)

    async def change_password(self, user_id: str, old_password: str, new_password: str) -> None:
        """Change user password after verifying current password."""
        user = self.get_user(user_id)
        if not verify_password_hash(old_password, user.password_hash):
            raise ValidationError("Invalid current password")

        validate_password(new_password)
        await self._collection.update_one({"_id": user_id}, {"$set": {"password_hash": hash_password(new_password)}})
        await self.update_user_cache(user_id)

    async def delete_user(self, user_id: str) -> None:
        """Delete a user from the system."""
        if not self.has_user(user_id):
            raise NotFoundError(f"User '{user_id}' not found")

        if user_id == "admin":
            raise ValidationError("Cannot delete admin user")

        # TODO: When spaces are implemented, check if user is member of any space
        await self._collection.delete_one({"_id": user_id})
        del self._users[user_id]

    async def ensure_admin_user_exists(self) -> None:
        """Create default admin user if not exists."""
        if not self.has_user("admin"):
            await self.create_user("admin", "admin")

    async def update_all_users_cache(self) -> None:
        """Reload all users cache from database."""
        users = await User.list_cursor(self._collection.find())
        self._users = {user.id: user for user in users}

    async def update_user_cache(self, user_id: str) -> User:
        """Reload a specific user cache from database."""
        user = await self._collection.find_one({"_id": user_id})
        if user is None:
            raise NotFoundError(f"User '{user_id}' not found")
        self._users[user_id] = User.model_validate(user)
        return self._users[user_id]

    async def on_start(self) -> None:
        """Initialize cache and admin user."""
        await self.update_all_users_cache()
        await self.ensure_admin_user_exists()
        logger.debug("user_service_started", user_count=len(self._users))
