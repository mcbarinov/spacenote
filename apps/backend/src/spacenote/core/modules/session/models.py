from __future__ import annotations

from datetime import datetime
from typing import NewType

from pydantic import Field

from spacenote.core.db import MongoModel, PyObjectId
from spacenote.utils import now

AuthToken = NewType("AuthToken", str)


class Session(MongoModel):
    """User authentication session stored in MongoDB."""

    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id", serialization_alias="id")
    user_id: str = Field(..., description="User ID that owns this session")
    auth_token: str = Field(..., description="Unique authentication token")
    created_at: datetime = Field(default_factory=now, description="Session creation timestamp")
