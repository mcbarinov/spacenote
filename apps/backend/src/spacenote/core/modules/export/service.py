from spacenote.core.modules.export.models import (
    AttachmentExport,
    CommentExport,
    ExportData,
    NoteExport,
    SpaceExport,
)
from spacenote.core.service import Service
from spacenote.utils import now


class ExportService(Service):
    """Handles space data export and import."""

    async def export_space(self, space_slug: str, include_data: bool) -> ExportData:
        """Export space configuration and optionally all data."""
        space = self.core.services.space.get_space(space_slug)

        space_export = SpaceExport(
            slug=space.slug,
            title=space.title,
            description=space.description,
            members=space.members,
            fields=space.fields,
            filters=space.filters,
            notes_list_default_columns=space.notes_list_default_columns,
            hidden_fields_on_create=space.hidden_fields_on_create,
            created_at=space.created_at,
        )

        notes: list[NoteExport] | None = None
        comments: list[CommentExport] | None = None
        attachments: list[AttachmentExport] | None = None

        if include_data:
            notes = await self._export_notes(space_slug)
            comments = await self._export_comments(space_slug)
            attachments = await self._export_attachments(space_slug)

        return ExportData(
            exported_at=now(),
            space=space_export,
            notes=notes,
            comments=comments,
            attachments=attachments,
        )

    async def _export_notes(self, space_slug: str) -> list[NoteExport]:
        notes = await self.core.services.note.list_all_notes(space_slug)
        return [
            NoteExport(
                number=note.number,
                author=note.author,
                created_at=note.created_at,
                edited_at=note.edited_at,
                fields=note.fields,
            )
            for note in notes
        ]

    async def _export_comments(self, space_slug: str) -> list[CommentExport]:
        comments = await self.core.services.comment.list_all_comments(space_slug)
        return [
            CommentExport(
                note_number=comment.note_number,
                number=comment.number,
                author=comment.author,
                content=comment.content,
                created_at=comment.created_at,
                edited_at=comment.edited_at,
                parent_number=comment.parent_number,
            )
            for comment in comments
        ]

    async def _export_attachments(self, space_slug: str) -> list[AttachmentExport]:
        attachments = await self.core.services.attachment.list_all_attachments(space_slug)
        return [
            AttachmentExport(
                note_number=attachment.note_number,
                number=attachment.number,
                author=attachment.author,
                filename=attachment.filename,
                size=attachment.size,
                mime_type=attachment.mime_type,
                created_at=attachment.created_at,
            )
            for attachment in attachments
        ]
