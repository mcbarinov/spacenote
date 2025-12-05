import secrets

import structlog

from spacenote.core.modules.attachment.models import Attachment
from spacenote.core.modules.comment.models import Comment
from spacenote.core.modules.counter.models import CounterType
from spacenote.core.modules.export.models import (
    AttachmentExport,
    CommentExport,
    ExportData,
    NoteExport,
    SpaceExport,
)
from spacenote.core.modules.note.models import Note
from spacenote.core.modules.space.models import Space
from spacenote.core.service import Service
from spacenote.errors import ValidationError
from spacenote.utils import now

logger = structlog.get_logger(__name__)


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

    async def import_space(self, data: ExportData) -> Space:
        """Import space from export data."""
        space_slug = data.space.slug

        if self.core.services.space.has_space(space_slug):
            raise ValidationError(f"Space '{space_slug}' already exists")

        # Create missing users
        usernames = self._collect_usernames(data)
        for username in usernames:
            if not self.core.services.user.has_user(username) and username != "admin":
                password = secrets.token_urlsafe(16)
                await self.core.services.user.create_user(username, password)
                logger.info("import_user_created", username=username)

        # Convert and create space
        space_model = Space(
            slug=data.space.slug,
            title=data.space.title,
            description=data.space.description,
            members=data.space.members,
            fields=data.space.fields,
            filters=data.space.filters,
            hidden_fields_on_create=data.space.hidden_fields_on_create,
            created_at=data.space.created_at,
        )
        space = await self.core.services.space.import_space(space_model)

        # Import notes
        if data.notes:
            notes = [
                Note(
                    space_slug=space_slug,
                    number=n.number,
                    author=n.author,
                    created_at=n.created_at,
                    edited_at=n.edited_at,
                    fields=n.fields,
                )
                for n in data.notes
            ]
            await self.core.services.note.import_notes(notes)
            max_note = max(n.number for n in data.notes)
            await self.core.services.counter.set_sequence(space_slug, CounterType.NOTE, max_note)

        # Import comments
        if data.comments:
            comments = [
                Comment(
                    space_slug=space_slug,
                    note_number=c.note_number,
                    number=c.number,
                    author=c.author,
                    content=c.content,
                    created_at=c.created_at,
                    edited_at=c.edited_at,
                    parent_number=c.parent_number,
                )
                for c in data.comments
            ]
            await self.core.services.comment.import_comments(comments)
            note_max_comments: dict[int, int] = {}
            for c in data.comments:
                note_max_comments[c.note_number] = max(note_max_comments.get(c.note_number, 0), c.number)
            for note_number, max_comment in note_max_comments.items():
                await self.core.services.counter.set_sequence(space_slug, CounterType.COMMENT, max_comment, note_number)

        # Import attachment metadata
        if data.attachments:
            attachments = [
                Attachment(
                    space_slug=space_slug,
                    note_number=a.note_number,
                    number=a.number,
                    author=a.author,
                    filename=a.filename,
                    size=a.size,
                    mime_type=a.mime_type,
                    created_at=a.created_at,
                )
                for a in data.attachments
            ]
            await self.core.services.attachment.import_attachments(attachments)
            # Set attachment counters: group by note_number (None = space-level)
            att_note_max: dict[int | None, int] = {}
            for a in data.attachments:
                att_note_max[a.note_number] = max(att_note_max.get(a.note_number, 0), a.number)
            for att_note_num, max_attachment in att_note_max.items():
                await self.core.services.counter.set_sequence(space_slug, CounterType.ATTACHMENT, max_attachment, att_note_num)

        logger.info(
            "space_imported",
            space_slug=space_slug,
            notes_count=len(data.notes) if data.notes else 0,
            comments_count=len(data.comments) if data.comments else 0,
            attachments_count=len(data.attachments) if data.attachments else 0,
        )
        return space

    def _collect_usernames(self, data: ExportData) -> set[str]:
        """Collect all usernames from export data."""
        usernames = set(data.space.members)
        if data.notes:
            usernames.update(n.author for n in data.notes)
        if data.comments:
            usernames.update(c.author for c in data.comments)
        if data.attachments:
            usernames.update(a.author for a in data.attachments)
        return usernames
