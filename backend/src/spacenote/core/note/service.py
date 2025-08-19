from typing import Any

from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core.core import Service
from spacenote.core.field.parsers import parse_raw_fields
from spacenote.core.note.models import Note


class NoteService(Service):
    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)
        self._collection = database.get_collection("notes")

    async def list_notes(self, space_id: ObjectId) -> list[Note]:
        docs = await self._collection.find({"space_id": space_id}).to_list()
        return [Note.model_validate(doc) for doc in docs]

    async def create_note(self, space_id: ObjectId, author_id: ObjectId, raw_fields: dict[str, str]) -> Note:
        space = self.core.services.space.get_space(space_id)
        if author_id not in space.members:
            raise ValueError(f"User {author_id} is not a member of space {space_id}")

        # Parse raw fields into typed values using space field definitions
        parsed_fields = parse_raw_fields(space.fields, raw_fields)

        # Create and save the note
        note = Note(space_id=space_id, author_id=author_id, fields=parsed_fields)
        doc = note.model_dump(by_alias=True)
        result = await self._collection.insert_one(doc)
        note.id = result.inserted_id
        return note
