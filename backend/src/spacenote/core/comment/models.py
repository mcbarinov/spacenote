from datetime import datetime

from spacenote.core.db import MongoModel, PyObjectId


class Comment(MongoModel):
    note_id: PyObjectId
    space_id: PyObjectId
    author_id: PyObjectId
    number: int  # Sequential number for comments within a note
    content: str
    created_at: datetime
    edited_at: datetime | None = None  # for future editing functionality
    parent_id: PyObjectId | None = None  # for future threading functionality
