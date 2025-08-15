from datetime import datetime
from typing import NewType

from bson import ObjectId
from pydantic import Field

from spacenote.core.db import MongoModel
from spacenote.core.utils import now

AuthToken = NewType("AuthToken", str)


class Session(MongoModel):
    user_id: ObjectId
    auth_token: str
    created_at: datetime = Field(default_factory=now)
