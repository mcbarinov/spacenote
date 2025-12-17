from functools import cached_property
from typing import Any

from pymongo.asynchronous.collection import AsyncCollection

from spacenote.core.db import Collection
from spacenote.core.modules.attachment import storage
from spacenote.core.modules.attachment.metadata import extract_metadata
from spacenote.core.modules.attachment.models import Attachment, PendingAttachment
from spacenote.core.modules.counter.models import CounterType
from spacenote.core.service import Service
from spacenote.errors import NotFoundError

GLOBAL_COUNTER_KEY = "__global__"


class AttachmentService(Service):
    """Service for managing file attachments."""

    @cached_property
    def _pending_collection(self) -> AsyncCollection[dict[str, Any]]:
        return self.database.get_collection(Collection.PENDING_ATTACHMENTS)

    @cached_property
    def _attachments_collection(self) -> AsyncCollection[dict[str, Any]]:
        return self.database.get_collection(Collection.ATTACHMENTS)

    async def on_start(self) -> None:
        """Create indexes and ensure storage directories exist."""
        await self._pending_collection.create_index("number", unique=True)
        await self._attachments_collection.create_index([("space_slug", 1), ("note_number", 1), ("number", 1)], unique=True)
        storage.ensure_pending_attachments_dir(self.core.config.attachments_path)

    async def create_pending_attachment(self, author: str, filename: str, content: bytes, mime_type: str) -> PendingAttachment:
        """Upload a file to pending storage."""
        number = await self.core.services.counter.get_next_sequence(GLOBAL_COUNTER_KEY, CounterType.PENDING_ATTACHMENT)

        storage.write_pending_attachment_file(self.core.config.attachments_path, number, content)

        file_path = storage.get_pending_attachment_path(self.core.config.attachments_path, number)
        meta = await extract_metadata(file_path, mime_type)

        pending = PendingAttachment(
            number=number,
            author=author,
            filename=filename,
            size=len(content),
            mime_type=mime_type,
            meta=meta,
        )
        await self._pending_collection.insert_one(pending.to_mongo())
        return pending

    async def get_pending_attachment(self, number: int) -> PendingAttachment:
        """Get pending attachment by number."""
        doc = await self._pending_collection.find_one({"number": number})
        if doc is None:
            raise NotFoundError(f"Pending attachment not found: {number}")
        return PendingAttachment.model_validate(doc)

    async def create_attachment(
        self, space_slug: str, note_number: int | None, author: str, filename: str, content: bytes, mime_type: str
    ) -> Attachment:
        """Create attachment directly (space-level or note-level)."""
        number = await self.core.services.counter.get_next_sequence(space_slug, CounterType.ATTACHMENT, note_number)

        storage.write_attachment_file(self.core.config.attachments_path, space_slug, note_number, number, content)

        file_path = storage.get_attachment_file_path(self.core.config.attachments_path, space_slug, note_number, number)
        meta = await extract_metadata(file_path, mime_type)

        attachment = Attachment(
            space_slug=space_slug,
            note_number=note_number,
            number=number,
            author=author,
            filename=filename,
            size=len(content),
            mime_type=mime_type,
            meta=meta,
        )
        await self._attachments_collection.insert_one(attachment.to_mongo())
        return attachment

    async def list_space_attachments(self, space_slug: str) -> list[Attachment]:
        """List all space-level attachments."""
        cursor = self._attachments_collection.find({"space_slug": space_slug, "note_number": None})
        return [Attachment.model_validate(doc) async for doc in cursor]

    async def list_note_attachments(self, space_slug: str, note_number: int) -> list[Attachment]:
        """List all attachments for a specific note."""
        cursor = self._attachments_collection.find({"space_slug": space_slug, "note_number": note_number})
        return [Attachment.model_validate(doc) async for doc in cursor]

    async def list_all_attachments(self, space_slug: str) -> list[Attachment]:
        """List all attachments in space without pagination."""
        cursor = self._attachments_collection.find({"space_slug": space_slug}).sort([("note_number", 1), ("number", 1)])
        return await Attachment.list_cursor(cursor)

    async def get_attachment(self, space_slug: str, note_number: int | None, number: int) -> Attachment:
        """Get attachment by its identifiers."""
        doc = await self._attachments_collection.find_one(
            {"space_slug": space_slug, "note_number": note_number, "number": number}
        )
        if doc is None:
            raise NotFoundError(f"Attachment not found: {space_slug}/{note_number}/{number}")
        return Attachment.model_validate(doc)

    async def finalize_pending(self, pending_number: int, space_slug: str, note_number: int) -> Attachment:
        """Move pending attachment to permanent storage for a note."""
        pending = await self.get_pending_attachment(pending_number)

        attachment_number = await self.core.services.counter.get_next_sequence(space_slug, CounterType.ATTACHMENT, note_number)

        storage.move_pending_to_attachment(
            self.core.config.attachments_path, pending_number, space_slug, note_number, attachment_number
        )

        attachment = Attachment(
            space_slug=space_slug,
            note_number=note_number,
            number=attachment_number,
            author=pending.author,
            filename=pending.filename,
            size=pending.size,
            mime_type=pending.mime_type,
            meta=pending.meta,
        )
        await self._attachments_collection.insert_one(attachment.to_mongo())
        await self._pending_collection.delete_one({"number": pending_number})

        return attachment

    async def import_attachments(self, attachments: list[Attachment]) -> int:
        """Bulk insert pre-built attachments (for import, metadata only)."""
        if not attachments:
            return 0

        await self._attachments_collection.insert_many([a.to_mongo() for a in attachments])
        return len(attachments)

    async def delete_attachments_by_space(self, space_slug: str) -> int:
        """Delete all attachments in a space (DB records + files)."""
        result = await self._attachments_collection.delete_many({"space_slug": space_slug})
        storage.delete_space_dir(self.core.config.attachments_path, space_slug)
        return result.deleted_count
