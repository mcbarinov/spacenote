from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from spacenote.core.db import MongoModel
from spacenote.utils import now


class User(MongoModel):
    """User domain model with credentials."""

    id: str = Field(alias="_id", serialization_alias="id")
    password_hash: str
    created_at: datetime = Field(default_factory=now)


class UserView(BaseModel):
    """User account information (API representation)."""

    id: str = Field(..., description="User ID")

    @classmethod
    def from_domain(cls, user: User) -> UserView:
        """Create view model from domain model."""
        return cls(id=user.id)
