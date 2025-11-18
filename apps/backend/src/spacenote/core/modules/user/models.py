from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from spacenote.core.db import MongoModel
from spacenote.utils import now


class User(MongoModel):
    """User domain model with credentials."""

    username: str
    password_hash: str
    created_at: datetime = Field(default_factory=now)


class UserView(BaseModel):
    """User account information (API representation)."""

    username: str = Field(..., description="Username")

    @classmethod
    def from_domain(cls, user: User) -> UserView:
        """Create view model from domain model."""
        return cls(username=user.username)
