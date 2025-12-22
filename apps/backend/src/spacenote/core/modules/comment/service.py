from functools import cached_property
from typing import Any

import structlog
from pymongo.asynchronous.collection import AsyncCollection

from spacenote.core.db import Collection
from spacenote.core.modules.comment.models import Comment
from spacenote.core.modules.counter.models import CounterType
from spacenote.core.modules.field.models import FieldValueType
from spacenote.core.pagination import PaginationResult
from spacenote.core.service import Service
from spacenote.errors import NotFoundError, ValidationError
from spacenote.utils import now

logger = structlog.get_logger(__name__)


class CommentService(Service):
    """Manages comments on notes with threading support."""

    @cached_property
    def _collection(self) -> AsyncCollection[dict[str, Any]]:
        return self.database.get_collection(Collection.COMMENTS)

    async def on_start(self) -> None:
        """Create indexes for comment lookup."""
        await self._collection.create_index([("space_slug", 1), ("note_number", 1), ("number", 1)], unique=True)
        await self._collection.create_index([("space_slug", 1), ("note_number", 1)])

    async def list_comments(
        self, space_slug: str, note_number: int, limit: int = 50, offset: int = 0
    ) -> PaginationResult[Comment]:
        """List paginated comments for a note."""
        query = {"space_slug": space_slug, "note_number": note_number}

        total = await self._collection.count_documents(query)

        cursor = self._collection.find(query).sort("number", 1).skip(offset).limit(limit)
        docs = await cursor.to_list()
        items = [Comment.model_validate(doc) for doc in docs]

        return PaginationResult(items=items, total=total, limit=limit, offset=offset)

    async def list_all_comments(self, space_slug: str) -> list[Comment]:
        """List all comments in space without pagination."""
        cursor = self._collection.find({"space_slug": space_slug}).sort([("note_number", 1), ("number", 1)])
        return await Comment.list_cursor(cursor)

    async def get_comment(self, space_slug: str, note_number: int, number: int) -> Comment:
        """Get comment by natural key."""
        doc = await self._collection.find_one({"space_slug": space_slug, "note_number": note_number, "number": number})
        if not doc:
            raise NotFoundError(f"Comment not found: space_slug={space_slug}, note_number={note_number}, number={number}")
        return Comment.model_validate(doc)

    async def create_comment(
        self,
        space_slug: str,
        note_number: int,
        author: str,
        content: str,
        parent_number: int | None = None,
        raw_fields: dict[str, str] | None = None,
    ) -> Comment:
        """Create a new comment on a note, optionally updating fields."""
        note = await self.core.services.note.get_note(space_slug, note_number)

        # Update fields if provided
        changes: dict[str, tuple[FieldValueType, FieldValueType]] | None = None
        if raw_fields:
            space = self.core.services.space.get_space(space_slug)
            for field_name in raw_fields:
                if field_name not in space.editable_fields_on_comment:
                    raise ValidationError(f"Field '{field_name}' is not editable when commenting")

            note, changes = await self.core.services.note.update_note_fields(
                space_slug, note_number, raw_fields, author, skip_activity_notification=True
            )

        # Validate parent exists if specified
        if parent_number is not None:
            parent = await self._collection.find_one(
                {"space_slug": space_slug, "note_number": note_number, "number": parent_number}
            )
            if not parent:
                raise ValidationError(f"Parent comment not found: number={parent_number}")

        next_number = await self.core.services.counter.get_next_sequence(space_slug, CounterType.COMMENT, note_number)

        comment = Comment(
            space_slug=space_slug,
            note_number=note_number,
            number=next_number,
            author=author,
            content=content,
            parent_number=parent_number,
        )

        await self._collection.insert_one(comment.to_mongo())
        await self.core.services.note.update_activity(space_slug, note_number, commented=True)
        logger.debug("comment_created", space_slug=space_slug, note_number=note_number, number=next_number, author=author)
        await self.core.services.telegram.notify_activity_comment_created(note, comment, changes)
        return comment

    async def update_comment(self, space_slug: str, note_number: int, number: int, content: str) -> Comment:
        """Update comment content."""
        await self.get_comment(space_slug, note_number, number)  # Verify exists

        await self._collection.update_one(
            {"space_slug": space_slug, "note_number": note_number, "number": number},
            {"$set": {"content": content, "edited_at": now()}},
        )
        await self.core.services.note.update_activity(space_slug, note_number)

        logger.debug("comment_updated", space_slug=space_slug, note_number=note_number, number=number)
        return await self.get_comment(space_slug, note_number, number)

    async def delete_comment(self, space_slug: str, note_number: int, number: int) -> None:
        """Delete a comment (orphans any replies)."""
        await self.get_comment(space_slug, note_number, number)  # Verify exists

        await self._collection.delete_one({"space_slug": space_slug, "note_number": note_number, "number": number})
        await self.core.services.note.update_activity(space_slug, note_number)
        logger.debug("comment_deleted", space_slug=space_slug, note_number=note_number, number=number)

    async def delete_comments_by_note(self, space_slug: str, note_number: int) -> int:
        """Delete all comments for a note."""
        result = await self._collection.delete_many({"space_slug": space_slug, "note_number": note_number})
        return result.deleted_count

    async def delete_comments_by_space(self, space_slug: str) -> int:
        """Delete all comments in a space."""
        result = await self._collection.delete_many({"space_slug": space_slug})
        return result.deleted_count

    async def import_comments(self, comments: list[Comment]) -> int:
        """Bulk insert pre-built comments (for import)."""
        if not comments:
            return 0

        await self._collection.insert_many([c.to_mongo() for c in comments])
        return len(comments)
