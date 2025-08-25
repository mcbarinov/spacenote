"""User authentication models."""

from spacenote.core.db import MongoModel


class User(MongoModel):
    """System user account.

    Indexed on username - unique.
    """

    username: str
    password_hash: str  # bcrypt hash
