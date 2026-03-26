from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from spacenote.core.db import MongoModel
from spacenote.utils import now


class User(MongoModel):
    """User entity."""

    username: str
    password_hash: str
    is_admin: bool = Field(default=False)
    created_at: datetime = Field(default_factory=now)


class UserView(BaseModel):
    """User account information (API representation)."""

    username: str = Field(..., description="Username")
    is_admin: bool = Field(..., description="Whether user has admin privileges")

    @classmethod
    def from_domain(cls, user: User) -> UserView:
        """Create view model from domain model."""
        return cls(username=user.username, is_admin=user.is_admin)
