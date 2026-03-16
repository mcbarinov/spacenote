from functools import cached_property
from typing import Any

import structlog
from pydantic import BaseModel
from pymongo.asynchronous.collection import AsyncCollection

from spacenote.core.db import Collection
from spacenote.core.modules.counter.models import CounterType
from spacenote.core.modules.field.models import FieldType, FieldValueType
from spacenote.core.modules.field.validators import validate_transfer_schema_compatibility
from spacenote.core.modules.note.models import Note
from spacenote.core.pagination import PaginationResult
from spacenote.core.service import Service
from spacenote.errors import NotFoundError, ValidationError
from spacenote.utils import now

logger = structlog.get_logger(__name__)


class NoteService(Service):
    """Manages notes with custom fields in spaces."""

    @cached_property
    def _collection(self) -> AsyncCollection[dict[str, Any]]:
        return self.database.get_collection(Collection.NOTES)

    async def on_start(self) -> None:
        """Create indexes for space/number lookup and sorting."""
        await self._collection.create_index([("space_slug", 1), ("number", 1)], unique=True)
        await self._collection.create_index([("space_slug", 1)])

    async def list_notes(
        self,
        space_slug: str,
        current_user: str,
        filter_name: str | None = None,
        adhoc_query: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> PaginationResult[Note]:
        """List paginated notes in space.

        Args:
            filter_name: Filter to apply. If None, uses Space.default_filter.
        """
        if filter_name is None:
            space = self.core.services.space.get_space(space_slug)
            filter_name = space.default_filter
            # Fallback if default_filter references a deleted filter
            if not space.get_filter(filter_name):
                filter_name = "all"

        query, sort_spec = self.core.services.filter.build_query(space_slug, filter_name, current_user, adhoc_query)

        total = await self._collection.count_documents(query)
        cursor = self._collection.find(query).sort(sort_spec).skip(offset).limit(limit)
        docs = await cursor.to_list()
        items = [Note.model_validate(doc) for doc in docs]
        self._set_titles(items)

        return PaginationResult(items=items, total=total, limit=limit, offset=offset)

    async def list_all_notes(self, space_slug: str) -> list[Note]:
        """List all notes in space without pagination."""
        cursor = self._collection.find({"space_slug": space_slug}).sort("number", 1)
        notes = await Note.list_cursor(cursor)
        self._set_titles(notes)
        return notes

    async def get_note(self, space_slug: str, number: int) -> Note:
        """Get note by space and sequential number."""
        doc = await self._collection.find_one({"space_slug": space_slug, "number": number})
        if not doc:
            raise NotFoundError(f"Note not found: space_slug={space_slug}, number={number}")
        note = Note.model_validate(doc)
        self._set_title(note)
        return note

    async def create_note(self, space_slug: str, author: str, raw_fields: dict[str, str]) -> Note:
        """Create note from raw fields."""
        logger.debug("create_note_request", space_slug=space_slug, raw_fields=raw_fields)
        space = self.core.services.space.get_space(space_slug)

        parsed_fields = await self.core.services.field.parse_raw_fields(space_slug, raw_fields, current_user=author)
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
        self._set_title(note)
        logger.debug("note_created", space_slug=space_slug, number=next_number, author=author)
        await self.core.services.telegram.notify_activity_note_created(note)
        await self.core.services.telegram.notify_mirror_create(note)
        return note

    async def update_note_fields(
        self,
        space_slug: str,
        number: int,
        raw_fields: dict[str, str],
        current_user: str,
        skip_activity_notification: bool = False,
    ) -> tuple[Note, dict[str, tuple[FieldValueType, FieldValueType]]]:
        """Update specific note fields. Returns (updated_note, changes)."""
        logger.debug("update_note_request", space_slug=space_slug, number=number, raw_fields=raw_fields)
        old_note = await self.get_note(space_slug, number)
        parsed_fields = await self.core.services.field.parse_raw_fields(
            space_slug, raw_fields, current_fields=old_note.fields, current_user=current_user, partial=True
        )

        timestamp = now()
        update_doc: dict[str, Any] = {"edited_at": timestamp, "activity_at": timestamp}
        for field_name, field_value in parsed_fields.items():
            update_doc[f"fields.{field_name}"] = field_value.model_dump() if isinstance(field_value, BaseModel) else field_value

        await self._collection.update_one({"space_slug": space_slug, "number": number}, {"$set": update_doc})

        logger.debug("note_updated", space_slug=space_slug, number=number, updated_fields=list(parsed_fields.keys()))
        note = await self.get_note(space_slug, number)

        changes: dict[str, tuple[FieldValueType, FieldValueType]] = {
            name: (old_note.fields.get(name), note.fields.get(name))
            for name in parsed_fields
            if old_note.fields.get(name) != note.fields.get(name)
        }

        if not skip_activity_notification:
            await self.core.services.telegram.notify_activity_note_updated(note, changes, current_user)
        await self.core.services.telegram.notify_mirror_update(note)

        return note, changes

    async def update_activity(self, space_slug: str, number: int, *, commented: bool = False) -> None:
        """Update note activity timestamps (called on comment create/edit/delete)."""
        update_doc: dict[str, Any] = {"activity_at": now()}
        if commented:
            update_doc["commented_at"] = update_doc["activity_at"]

        await self._collection.update_one({"space_slug": space_slug, "number": number}, {"$set": update_doc})

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

    async def transfer_note(self, source_slug: str, note_number: int, target_slug: str) -> Note:
        """Transfer a note from one space to another."""
        # Validate transfer is allowed
        source_space = self.core.services.space.get_space(source_slug)
        if target_slug not in source_space.can_transfer_to:
            raise ValidationError(f"Transfer to '{target_slug}' is not allowed from '{source_slug}'")
        target_space = self.core.services.space.get_space(target_slug)
        validate_transfer_schema_compatibility(source_space, target_space)

        # Create new note in target space (copy metadata + fields)
        source_note = await self.get_note(source_slug, note_number)
        new_number = await self.core.services.counter.get_next_sequence(target_slug, CounterType.NOTE)
        new_note = Note(
            space_slug=target_slug,
            number=new_number,
            author=source_note.author,
            created_at=source_note.created_at,
            edited_at=source_note.edited_at,
            commented_at=source_note.commented_at,
            activity_at=source_note.activity_at,
            fields=dict(source_note.fields),
        )

        # Copy attachments, images (with field remapping), and comments
        att_map = await self.core.services.attachment.transfer_note_attachments(source_slug, note_number, target_slug, new_number)
        self.core.services.image.transfer_note_images(
            source_slug, note_number, target_slug, new_number, att_map, note_fields=new_note.fields
        )
        await self.core.services.comment.transfer_note_comments(source_slug, note_number, target_slug, new_number)

        # Insert new note
        await self._collection.insert_one(new_note.to_mongo())

        # Update Telegram mirrors
        await self.core.services.telegram.notify_mirror_delete(source_slug, note_number)
        self._set_title(new_note)
        await self.core.services.telegram.notify_mirror_create(new_note)

        # Delete source note and related data
        await self.core.services.comment.delete_comments_by_note(source_slug, note_number)
        await self.core.services.attachment.delete_attachments_by_note(source_slug, note_number)
        self.core.services.image.delete_images_by_note(source_slug, note_number)
        await self._collection.delete_one({"space_slug": source_slug, "number": note_number})
        await self.core.services.counter.delete_counters_by_note(source_slug, note_number)
        logger.info("note_transferred", source=f"{source_slug}#{note_number}", target=f"{target_slug}#{new_number}")
        return new_note

    def _set_title(self, note: Note) -> None:
        """Compute and set note title from template."""
        space = self.core.services.space.get_space(note.space_slug)
        note.title = self.core.services.template.render_note_title(space, note)

    def _set_titles(self, notes: list[Note]) -> None:
        """Compute and set titles for multiple notes. All notes must be from the same space."""
        if not notes:
            return
        space_slug = notes[0].space_slug
        if any(n.space_slug != space_slug for n in notes):
            raise ValueError("All notes must be from the same space")
        space = self.core.services.space.get_space(space_slug)
        for note in notes:
            note.title = self.core.services.template.render_note_title(space, note)
