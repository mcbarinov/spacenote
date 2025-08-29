from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core.comment.models import Comment
from spacenote.core.core import Service
from spacenote.core.note.models import Note
from spacenote.core.space.models import Space


class ExportService(Service):
    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)

    async def export_space(self, space: Space, include_data: bool = False) -> dict[str, Any]:
        """Export space configuration and optionally data.

        Args:
            space: The space to export
            include_data: If True, include notes and comments in the export

        Returns:
            Dictionary containing the exported data
        """
        # Build export dict with space configuration
        export_data: dict[str, Any] = {
            "slug": space.slug,
            "title": space.title,
            "fields": [field.model_dump() for field in space.fields],
            "filters": [filter.model_dump() for filter in space.filters],
            "list_fields": space.list_fields,
            "hidden_create_fields": space.hidden_create_fields,
            "templates": {
                "note_detail": space.templates.note_detail,
                "note_list": space.templates.note_list,
            },
        }

        # Optionally include notes and comments
        if include_data:
            if not self._core:
                raise RuntimeError("Core not initialized")
            notes = await self._core.services.note.list_notes(space.id)
            export_data["notes"] = []

            for note in notes:
                note_data = await self._export_note(note)
                export_data["notes"].append(note_data)

        return export_data

    async def _export_note(self, note: Note) -> dict[str, Any]:
        """Export a single note with its comments.

        Args:
            note: The note to export

        Returns:
            Dictionary containing the exported note data
        """
        if not self._core:
            raise RuntimeError("Core not initialized")
        author = self._core.services.user.get_user(note.author_id)

        note_data: dict[str, Any] = {
            "number": note.number,
            "fields": note.fields,
            "author_username": author.username,
            "created_at": note.created_at.isoformat(),
            "edited_at": note.edited_at.isoformat() if note.edited_at else None,
        }

        # Get comments for this note
        if not self._core:
            raise RuntimeError("Core not initialized")
        comments = await self._core.services.comment.get_note_comments(note.id)
        if comments:
            note_data["comments"] = [self._export_comment(comment) for comment in comments]

        return note_data

    def _export_comment(self, comment: Comment) -> dict[str, Any]:
        """Export a single comment.

        Args:
            comment: The comment to export

        Returns:
            Dictionary containing the exported comment data
        """
        if not self._core:
            raise RuntimeError("Core not initialized")
        author = self._core.services.user.get_user(comment.author_id)

        return {
            "number": comment.number,
            "content": comment.content,
            "author_username": author.username,
            "created_at": comment.created_at.isoformat(),
        }
