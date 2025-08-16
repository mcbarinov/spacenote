from spacenote.core.db import MongoModel


class User(MongoModel):
    username: str
    password_hash: str  # password_hash
