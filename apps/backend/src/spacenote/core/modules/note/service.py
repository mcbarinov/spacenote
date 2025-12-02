from typing import Any

import structlog
from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core.db import Collection
from spacenote.core.modules.counter.models import CounterType
from spacenote.core.modules.field.models import FieldType
from spacenote.core.modules.note.models import Note
from spacenote.core.pagination import PaginationResult
from spacenote.core.service import Service
from spacenote.errors import NotFoundError
from spacenote.utils import now

logger = structlog.get_logger(__name__)


class NoteService(Service):
    """Manages notes with custom fields in spaces."""

    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)
        self._collection = database.get_collection(Collection.NOTES)

    async def on_start(self) -> None:
        """Create indexes for space/number lookup and sorting."""
        await self._collection.create_index([("space_slug", 1), ("number", 1)], unique=True)
        await self._collection.create_index([("space_slug", 1)])

    async def list_notes(
        self, space_slug: str, current_user: str, filter_name: str, limit: int = 50, offset: int = 0
    ) -> PaginationResult[Note]:
        """Get paginated notes in space."""
        query, sort_spec = self.core.services.filter.build_query(space_slug, filter_name, current_user)

        total = await self._collection.count_documents(query)
        cursor = self._collection.find(query).sort(sort_spec).skip(offset).limit(limit)
        docs = await cursor.to_list()
        items = [Note.model_validate(doc) for doc in docs]

        return PaginationResult(items=items, total=total, limit=limit, offset=offset)

    async def list_all_notes(self, space_slug: str) -> list[Note]:
        """Get all notes in space without pagination."""
        cursor = self._collection.find({"space_slug": space_slug}).sort("number", 1)
        return await Note.list_cursor(cursor)

    async def get_note(self, space_slug: str, number: int) -> Note:
        """Get note by space and sequential number."""
        doc = await self._collection.find_one({"space_slug": space_slug, "number": number})
        if not doc:
            raise NotFoundError(f"Note not found: space_slug={space_slug}, number={number}")
        return Note.model_validate(doc)

    async def create_note(self, space_slug: str, author: str, raw_fields: dict[str, str]) -> Note:
        """Create note from raw fields."""
        space = self.core.services.space.get_space(space_slug)
        parsed_fields = self.core.services.field.parse_raw_fields(space_slug, raw_fields, current_user=author)
        next_number = await self.core.services.counter.get_next_sequence(space_slug, CounterType.NOTE)

        # Process IMAGE fields (if any): finalize pending attachments and schedule WebP generation
        image_field_names = {f.name for f in space.fields if f.type == FieldType.IMAGE}
        image_fields = {
            name: value for name, value in parsed_fields.items() if name in image_field_names and isinstance(value, int)
        }
        if image_fields:
            processed = await self.core.services.image.process_image_fields(space_slug, next_number, image_fields)
            parsed_fields.update(processed)

        note = Note(space_slug=space_slug, number=next_number, author=author, fields=parsed_fields)

        await self._collection.insert_one(note.to_mongo())
        logger.debug("note_created", space_slug=space_slug, number=next_number, author=author)
        return note

    async def update_note_fields(self, space_slug: str, number: int, raw_fields: dict[str, str], current_user: str) -> Note:
        """Update specific note fields with validation (partial update)."""
        await self.get_note(space_slug, number)  # Verify note exists
        parsed_fields = self.core.services.field.parse_raw_fields(space_slug, raw_fields, current_user, partial=True)

        timestamp = now()
        update_doc: dict[str, Any] = {"edited_at": timestamp}
        for field_name, field_value in parsed_fields.items():
            update_doc[f"fields.{field_name}"] = field_value

        await self._collection.update_one(
            {"space_slug": space_slug, "number": number},
            {"$set": update_doc},
        )

        logger.debug("note_updated", space_slug=space_slug, number=number, updated_fields=list(parsed_fields.keys()))
        return await self.get_note(space_slug, number)

    async def delete_notes_by_space(self, space_slug: str) -> int:
        """Delete all notes in a space and return count of deleted notes."""
        result = await self._collection.delete_many({"space_slug": space_slug})
        return result.deleted_count

    async def import_notes(self, notes: list[Note]) -> int:
        """Bulk insert pre-built notes (for import)."""
        if not notes:
            return 0

        await self._collection.insert_many([n.to_mongo() for n in notes])
        return len(notes)
