from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from spacenote.core.space.models import Space

import structlog
from pymongo.asynchronous.collection import AsyncCollection
from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core.attachment.models import ATTACHMENT_CATEGORIES, AttachmentCategory
from spacenote.core.core import Service
from spacenote.core.errors import NotFoundError, ValidationError
from spacenote.core.field.models import FieldType, FieldValueType
from spacenote.core.field.validators import validate_note_fields
from spacenote.core.filter.mongo import build_mongodb_query, build_sort_spec
from spacenote.core.note.models import Note, PaginationResult
from spacenote.core.user.models import User

logger = structlog.get_logger(__name__)


class NoteService(Service):
    """Service for managing spaces with in-memory caching."""

    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)
        self._collections: dict[str, AsyncCollection[dict[str, Any]]] = {}

    def add_collection(self, space_id: str) -> None:
        """Add a new collection for a space."""
        self._collections[space_id] = self.database.get_collection(f"{space_id}_notes")

    async def on_start(self) -> None:
        """Initialize service on application startup."""
        for space in self.core.services.space.get_spaces():
            self._collections[space.id] = self.database.get_collection(f"{space.id}_notes")
        logger.debug("note_service_started", collections_count=len(self._collections))

    async def resolve_and_validate_fields(
        self, space: "Space", validated_fields: dict[str, FieldValueType], current_user: User
    ) -> dict[str, FieldValueType]:
        """Resolve special values and validate field constraints after initial validation."""
        # Step 1: Resolve special values using SpecialService
        resolved_fields = await self.core.services.special.resolve_field_values(space, validated_fields, current_user)

        # Step 2: Additional validation for IMAGE fields
        for field in space.fields:
            field_name = field.name
            if (
                field.type == FieldType.IMAGE
                and resolved_fields[field_name] is not None
                and isinstance(resolved_fields[field_name], int)
            ):
                attachment_id: int = resolved_fields[field_name]  # type: ignore[assignment]
                await self._validate_image_attachment(space.id, attachment_id)

        return resolved_fields

    async def _validate_image_attachment(self, space_id: str, attachment_id: int) -> None:
        """Validate that an attachment exists, is unassigned, and is an image."""
        try:
            attachment = await self.core.services.attachment.get_attachment(space_id, attachment_id)
        except ValueError as e:
            raise ValidationError(f"Attachment {attachment_id} not found in space {space_id}") from e

        if attachment.note_id is not None:
            raise ValidationError(f"Attachment {attachment_id} is already assigned to note {attachment.note_id}")

        if attachment.content_type not in ATTACHMENT_CATEGORIES[AttachmentCategory.IMAGES]:
            raise ValidationError(f"Attachment {attachment_id} is not an image (content type: {attachment.content_type})")

    async def list_notes(
        self, space_id: str, filter_id: str | None = None, current_user: User | None = None, page: int = 1, page_size: int = 20
    ) -> PaginationResult:
        """List notes in a space with optional filter and pagination."""
        collection = self._collections[space_id]

        # Build query and sort based on filter
        if filter_id:
            space = self.core.services.space.get_space(space_id)
            filter = space.get_filter(filter_id)
            if not filter:
                raise ValidationError(f"Filter '{filter_id}' not found in space")

            query = build_mongodb_query(filter, space, current_user)
            sort_spec = build_sort_spec(filter)
        else:
            query = {}
            sort_spec = [("_id", -1)]

        # Get total count
        total_count = await collection.count_documents(query)

        # Calculate pagination
        skip = (page - 1) * page_size
        total_pages = (total_count + page_size - 1) // page_size

        # Get paginated results
        cursor = collection.find(query)
        for field, direction in sort_spec:
            cursor = cursor.sort(field, direction)
        cursor = cursor.skip(skip).limit(page_size)

        notes = await Note.list_cursor(cursor)

        return PaginationResult(
            notes=notes,
            total_count=total_count,
            current_page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        )

    async def create_note_from_raw_fields(self, space_id: str, author: str, raw_fields: dict[str, str]) -> Note:
        """Create a new note in a space from raw field values (validates and converts)."""
        log = logger.bind(space_id=space_id, author=author, action="create_note")
        log.debug("creating_note")

        space = self.core.services.space.get_space(space_id)

        # Get the next auto-increment ID for this space
        last_note = await self._collections[space_id].find({}).sort("_id", -1).limit(1).to_list(1)
        next_id = 1 if not last_note else last_note[0]["_id"] + 1

        # Step 1: Basic validation (pure function)
        validated_fields = await validate_note_fields(space, raw_fields, skip_missing=True)

        # Step 2: Resolve special values and validate constraints (service layer)
        current_user = self.core.services.user.get_user(author)
        resolved_fields = await self.resolve_and_validate_fields(space, validated_fields, current_user)

        note = Note(
            id=next_id,
            author=author,
            created_at=datetime.now(UTC),
            fields=resolved_fields,
        )
        await self._collections[space_id].insert_one(note.to_dict())

        # Assign IMAGE field attachments to this note
        await self._assign_image_attachments(space, note.id, resolved_fields)

        log.debug("note_created", note_id=note.id)

        # Send Telegram notification if enabled
        await self._send_telegram_notification(space_id, "new_note", note, author)

        return note

    async def get_note(self, space_id: str, note_id: int) -> Note:
        """Get a single note by ID from a space."""
        res = await self._collections[space_id].find_one({"_id": note_id})
        if res is None:
            raise NotFoundError(f"Note with ID {note_id} not found in space {space_id}")
        return Note.model_validate(res)

    async def update_comment_stats(self, space_id: str, note_id: int, last_comment_date: datetime) -> None:
        """Update comment statistics for a note after a new comment is added."""
        await self._collections[space_id].update_one(
            {"_id": note_id}, {"$inc": {"comment_count": 1}, "$set": {"last_comment_at": last_comment_date}}
        )

    async def increment_attachment_counts(self, space_id: str, note_id: int, category: AttachmentCategory) -> None:
        """Increment the attachment counts for a note based on category."""
        update_fields = {
            "attachment_counts.total": 1,
            f"attachment_counts.{category}": 1,
        }
        await self._collections[space_id].update_one({"_id": note_id}, {"$inc": update_fields})

    async def decrement_attachment_counts(self, space_id: str, note_id: int, category: AttachmentCategory) -> None:
        """Decrement the attachment counts for a note based on category."""
        update_fields = {
            "attachment_counts.total": -1,
            f"attachment_counts.{category}": -1,
        }
        await self._collections[space_id].update_one({"_id": note_id}, {"$inc": update_fields})

    async def update_note_from_raw_fields(self, space_id: str, note_id: int, raw_fields: dict[str, str], author: str) -> Note:
        """Update an existing note in a space from raw field values (validates and converts)."""
        log = logger.bind(space_id=space_id, note_id=note_id, action="update_note")
        log.debug("updating_note")

        space = self.core.services.space.get_space(space_id)

        # Step 1: Basic validation (pure function)
        validated_fields = await validate_note_fields(space, raw_fields, skip_missing=False)

        # Step 2: Resolve special values and validate constraints (service layer)
        current_user = self.core.services.user.get_user(author)
        resolved_fields = await self.resolve_and_validate_fields(space, validated_fields, current_user)

        await self._collections[space_id].update_one(
            {"_id": note_id}, {"$set": {"fields": resolved_fields, "edited_at": datetime.now(UTC)}}
        )

        # Assign IMAGE field attachments to this note
        await self._assign_image_attachments(space, note_id, resolved_fields)

        log.debug("note_updated")

        # Send Telegram notification if enabled
        updated_note = await self.get_note(space_id, note_id)
        await self._send_telegram_notification(space_id, "field_update", updated_note, updated_note.author, raw_fields)

        return updated_note

    async def drop_collection(self, space_id: str) -> None:
        """Drop the entire collection for a space."""
        if space_id not in self._collections:
            raise NotFoundError(f"Collection for space '{space_id}' does not exist")
        await self._collections[space_id].drop()
        del self._collections[space_id]

    async def _send_telegram_notification(
        self, space_id: str, event_type: str, note: Note, author: str, changes: dict[str, str] | None = None
    ) -> None:
        """Send a Telegram notification for a note event."""
        try:
            space = self.core.services.space.get_space(space_id)
            if not space.telegram or not space.telegram.enabled:
                return

            # Prepare template context
            context = {
                "space": space,
                "note": note,
                "author": author,
                "changes": changes or {},
                "url": f"{self.core.config.base_url.rstrip('/')}/notes/{space_id}/{note.id}",
            }

            # Get the appropriate template
            template = getattr(space.telegram.templates, event_type)

            # Render and send the message
            message = self.core.services.telegram.render_template(template, context)
            note_url = f"{self.core.config.base_url.rstrip('/')}/notes/{space_id}/{note.id}"
            await self.core.services.telegram.send_notification(
                space.telegram.bot_id, space.telegram.channel_id, message, note_url
            )
        except Exception as e:
            logger.warning("telegram_notification_failed", error=str(e), space_id=space_id, event_type=event_type)

    async def count_notes(self, space_id: str) -> int:
        """Count the number of notes in a space."""
        if space_id not in self._collections:
            raise ValidationError(f"Collection for space '{space_id}' does not exist")
        return await self._collections[space_id].count_documents({})

    async def _assign_image_attachments(self, space: "Space", note_id: int, resolved_fields: dict[str, FieldValueType]) -> None:
        """Assign image attachments to a note based on IMAGE field values."""
        # Find all IMAGE fields in the space
        image_fields = [field for field in space.fields if field.type == FieldType.IMAGE]

        for field in image_fields:
            field_value = resolved_fields.get(field.name)
            if field_value is not None and isinstance(field_value, int):
                try:
                    # Assign the attachment to this note
                    await self.core.services.attachment.assign_to_note(space.id, field_value, note_id)
                except Exception as e:
                    logger.warning(
                        "failed_to_assign_image_attachment",
                        space_id=space.id,
                        note_id=note_id,
                        attachment_id=field_value,
                        error=str(e),
                    )
