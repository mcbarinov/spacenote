from typing import NewType

from spacenote.core.db import MongoModel

SessionId = NewType("SessionId", str)


class User(MongoModel):
    username: str
    password_hash: str  # password_hash
