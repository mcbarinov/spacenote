from typing import Any

from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core.core import Service
from spacenote.core.note.models import Note


class NoteService(Service):
    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)
        self._collection = database.get_collection("notes")

    async def list_notes(self, space_id: ObjectId) -> list[Note]:
        cursor = self._collection.find({"space_id": space_id})
        docs = await cursor.to_list(length=None)
        return [Note.model_validate(doc) for doc in docs]
