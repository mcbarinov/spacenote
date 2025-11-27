from typing import Any

import structlog
from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core.modules.comment.models import Comment
from spacenote.core.modules.counter.models import CounterType
from spacenote.core.pagination import PaginationResult
from spacenote.core.service import Service
from spacenote.errors import NotFoundError, ValidationError
from spacenote.utils import now

logger = structlog.get_logger(__name__)


class CommentService(Service):
    """Manages comments on notes with threading support."""

    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)
        self._collection = database.get_collection("comments")

    async def on_start(self) -> None:
        """Create indexes for comment lookup."""
        await self._collection.create_index([("space_slug", 1), ("note_number", 1), ("number", 1)], unique=True)
        await self._collection.create_index([("space_slug", 1), ("note_number", 1)])

    async def list_comments(
        self, space_slug: str, note_number: int, limit: int = 50, offset: int = 0
    ) -> PaginationResult[Comment]:
        """Get paginated comments for a note."""
        query = {"space_slug": space_slug, "note_number": note_number}

        total = await self._collection.count_documents(query)

        cursor = self._collection.find(query).sort("number", 1).skip(offset).limit(limit)
        docs = await cursor.to_list()
        items = [Comment.model_validate(doc) for doc in docs]

        return PaginationResult(items=items, total=total, limit=limit, offset=offset)

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
    ) -> Comment:
        """Create a new comment on a note."""
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
        logger.debug(
            "comment_created",
            space_slug=space_slug,
            note_number=note_number,
            number=next_number,
            author=author,
        )
        return comment

    async def update_comment(self, space_slug: str, note_number: int, number: int, content: str) -> Comment:
        """Update comment content."""
        await self.get_comment(space_slug, note_number, number)  # Verify exists

        await self._collection.update_one(
            {"space_slug": space_slug, "note_number": note_number, "number": number},
            {"$set": {"content": content, "edited_at": now()}},
        )

        logger.debug("comment_updated", space_slug=space_slug, note_number=note_number, number=number)
        return await self.get_comment(space_slug, note_number, number)

    async def delete_comment(self, space_slug: str, note_number: int, number: int) -> None:
        """Delete a comment (orphans any replies)."""
        await self.get_comment(space_slug, note_number, number)  # Verify exists

        await self._collection.delete_one({"space_slug": space_slug, "note_number": note_number, "number": number})
        logger.debug("comment_deleted", space_slug=space_slug, note_number=note_number, number=number)

    async def delete_comments_by_note(self, space_slug: str, note_number: int) -> int:
        """Delete all comments for a note."""
        result = await self._collection.delete_many({"space_slug": space_slug, "note_number": note_number})
        return result.deleted_count

    async def delete_comments_by_space(self, space_slug: str) -> int:
        """Delete all comments in a space."""
        result = await self._collection.delete_many({"space_slug": space_slug})
        return result.deleted_count
