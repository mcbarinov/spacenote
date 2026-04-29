from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from spacenote.config import Config
from spacenote.core.core import Core
from spacenote.core.modules.attachment import storage as attachment_storage
from spacenote.core.modules.attachment.models import Attachment, PendingAttachment
from spacenote.core.modules.backup.models import BackupInfo
from spacenote.core.modules.comment.models import Comment
from spacenote.core.modules.export.models import ExportData
from spacenote.core.modules.field.models import FieldValueType, SpaceField
from spacenote.core.modules.filter.models import Filter
from spacenote.core.modules.image.processor import WebpOptions
from spacenote.core.modules.log.models import ErrorLog
from spacenote.core.modules.note.models import Note
from spacenote.core.modules.session.models import AuthToken
from spacenote.core.modules.space.models import Member, Permission, Space
from spacenote.core.modules.telegram.models import (
    TelegramMirror,
    TelegramTask,
    TelegramTaskStatus,
    TelegramTaskType,
    TelegramTestResult,
)
from spacenote.core.modules.user.models import UserView
from spacenote.core.pagination import PaginationResult
from spacenote.errors import AuthenticationError


class App:
    """Facade for all application operations, validates permissions before delegating to Core."""

    # --- Lifecycle ---

    def __init__(self, config: Config) -> None:
        self._core = Core(config)

    @asynccontextmanager
    async def lifespan(self) -> AsyncGenerator[None]:
        """Application lifespan management - delegates to Core."""
        async with self._core.lifespan():
            yield

    async def check_database_health(self) -> bool:
        """Check if database is available (no authentication required)."""
        return await self._core.check_database_health()

    # --- Auth ---

    async def is_auth_token_valid(self, auth_token: AuthToken) -> bool:
        """Check if authentication token is valid."""
        return await self._core.services.session.is_auth_token_valid(auth_token)

    async def login(self, username: str, password: str) -> AuthToken:
        """Authenticate user and create session."""
        if not self._core.services.user.verify_password(username, password):
            raise AuthenticationError
        return await self._core.services.session.create_session(username)

    async def logout(self, auth_token: AuthToken) -> None:
        """Invalidate user session."""
        await self._core.services.session.invalidate_session(auth_token)

    # --- Profile ---

    async def get_current_user(self, auth_token: AuthToken) -> UserView:
        """Get current authenticated user profile."""
        user = await self._core.services.access.ensure_authenticated(auth_token)
        return UserView.from_domain(user)

    async def change_password(self, auth_token: AuthToken, old_password: str, new_password: str) -> None:
        """Change password for the current authenticated user."""
        user = await self._core.services.access.ensure_authenticated(auth_token)
        await self._core.services.user.change_password(user.username, old_password, new_password)

    # --- Users ---

    async def list_users(self, auth_token: AuthToken) -> list[UserView]:
        """List all users (requires authentication)."""
        await self._core.services.access.ensure_authenticated(auth_token)
        users = self._core.services.user.list_all_users()
        return [UserView.from_domain(user) for user in users]

    async def create_user(self, auth_token: AuthToken, username: str, password: str, *, is_admin: bool = False) -> UserView:
        """Create new user (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        user = await self._core.services.user.create_user(username, password, is_admin=is_admin)
        return UserView.from_domain(user)

    async def delete_user(self, auth_token: AuthToken, username: str) -> None:
        """Delete user (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        await self._core.services.user.delete_user(username)

    async def set_admin(self, auth_token: AuthToken, username: str, is_admin: bool) -> UserView:
        """Set user admin status (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        user = await self._core.services.user.set_admin(username, is_admin)
        return UserView.from_domain(user)

    async def set_password(self, auth_token: AuthToken, username: str, new_password: str) -> None:
        """Set user password (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        await self._core.services.user.set_password(username, new_password)

    # --- Spaces ---

    async def list_spaces(self, auth_token: AuthToken) -> list[Space]:
        """List spaces where the user is a member."""
        user = await self._core.services.access.ensure_authenticated(auth_token)
        return self._core.services.space.list_user_spaces(user.username)

    async def create_space(
        self,
        auth_token: AuthToken,
        slug: str,
        title: str,
        description: str,
        members: list[Member],
        source_space: str | None = None,
        parent: str | None = None,
    ) -> Space:
        """Create new space (any authenticated user)."""
        await self._core.services.access.ensure_authenticated(auth_token)
        return await self._core.services.space.create_space(slug, title, description, members, source_space, parent)

    async def list_all_spaces(self, auth_token: AuthToken) -> list[Space]:
        """List all spaces (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return self._core.services.space.list_all_spaces()

    async def admin_join_space(self, auth_token: AuthToken, slug: str) -> Space:
        """System admin adds themselves to a space with 'all' permission."""
        user = await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.space.add_member(slug, user.username, [Permission.ALL])

    async def admin_leave_space(self, auth_token: AuthToken, slug: str) -> Space:
        """System admin removes themselves from a space."""
        user = await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.space.remove_member(slug, user.username)

    async def update_space_title(self, auth_token: AuthToken, slug: str, title: str) -> Space:
        """Update space title (space admin only)."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.space.update_title(slug, title)

    async def update_space_description(self, auth_token: AuthToken, slug: str, description: str) -> Space:
        """Update space description (space admin only)."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.space.update_description(slug, description)

    async def update_space_members(self, auth_token: AuthToken, slug: str, members: list[Member]) -> Space:
        """Update space members (space admin only)."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.space.update_members(slug, members)

    async def update_hidden_fields_on_create(self, auth_token: AuthToken, slug: str, field_names: list[str]) -> Space:
        """Update hidden fields on create (space admin only)."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.space.update_hidden_fields_on_create(slug, field_names)

    async def update_editable_fields_on_comment(self, auth_token: AuthToken, slug: str, field_names: list[str]) -> Space:
        """Update editable fields on comment (space admin only)."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.space.update_editable_fields_on_comment(slug, field_names)

    async def update_default_filter(self, auth_token: AuthToken, slug: str, default_filter: str) -> Space:
        """Update space default filter (space admin only)."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.space.update_default_filter(slug, default_filter)

    async def update_can_transfer_to(self, auth_token: AuthToken, slug: str, slugs: list[str]) -> Space:
        """Update spaces where notes can be transferred to (space admin only)."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.space.update_can_transfer_to(slug, slugs)

    async def rename_space_slug(self, auth_token: AuthToken, slug: str, new_slug: str) -> Space:
        """Rename space slug (space admin only)."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.space.rename_slug(slug, new_slug)

    async def delete_space(self, auth_token: AuthToken, slug: str) -> None:
        """Delete space (space admin only)."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        await self._core.services.space.delete_space(slug)

    # --- Templates ---

    async def set_space_template(self, auth_token: AuthToken, slug: str, key: str, content: str) -> Space:
        """Set or remove a template (space admin only). Empty content removes the template."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.template.set_template(slug, key, content)

    # --- Fields ---

    async def add_field(self, auth_token: AuthToken, slug: str, field: SpaceField) -> SpaceField:
        """Add field to space (space admin only). Returns validated field."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.field.add_field(slug, field)

    async def remove_field(self, auth_token: AuthToken, slug: str, field_name: str) -> None:
        """Remove field from space (space admin only)."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        await self._core.services.field.remove_field(slug, field_name)

    async def update_field(
        self,
        auth_token: AuthToken,
        slug: str,
        field_name: str,
        required: bool,
        options: dict[str, Any],
        default: FieldValueType,
    ) -> SpaceField:
        """Update field in space (space admin only). Returns validated field."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.field.update_field(slug, field_name, required, options, default)

    # --- Filters ---

    async def add_filter(self, auth_token: AuthToken, slug: str, filter: Filter) -> Filter:
        """Add filter to space (space admin only). Returns validated filter."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.filter.add_filter(slug, filter)

    async def remove_filter(self, auth_token: AuthToken, slug: str, filter_name: str) -> None:
        """Remove filter from space (space admin only)."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        await self._core.services.filter.remove_filter(slug, filter_name)

    async def update_filter(self, auth_token: AuthToken, slug: str, filter_name: str, new_filter: Filter) -> Filter:
        """Update filter in space (space admin only). Returns validated filter."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.filter.update_filter(slug, filter_name, new_filter)

    # --- Telegram ---

    async def set_activity_channel(self, auth_token: AuthToken, slug: str, channel: str | None) -> Space:
        """Set or clear the activity channel (space admin only)."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.telegram.set_activity_channel(slug, channel)

    async def enable_mirror(self, auth_token: AuthToken, slug: str, channel: str) -> Space:
        """Enable mirror on the given channel (space admin only). See B004."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.telegram.enable_mirror(slug, channel)

    async def disable_mirror(self, auth_token: AuthToken, slug: str) -> Space:
        """Disable mirror and wipe DB-side mirror state (space admin only). See B004."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.telegram.disable_mirror(slug)

    async def test_telegram_channel(self, auth_token: AuthToken, slug: str, channel: str) -> TelegramTestResult:
        """Probe bot connectivity to a channel (space admin only). Sends a real test message."""
        await self._core.services.access.ensure_space_admin(auth_token, slug)
        return await self._core.services.telegram.test_channel(slug, channel)

    async def list_telegram_tasks(
        self,
        auth_token: AuthToken,
        space_slug: str | None = None,
        task_type: TelegramTaskType | None = None,
        status: TelegramTaskStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> PaginationResult[TelegramTask]:
        """List telegram tasks (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.telegram.list_telegram_tasks(space_slug, task_type, status, limit, offset)

    async def get_telegram_task(self, auth_token: AuthToken, space_slug: str, number: int) -> TelegramTask:
        """Get telegram task by natural key (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.telegram.get_telegram_task(space_slug, number)

    async def reset_telegram_task(self, auth_token: AuthToken, space_slug: str, number: int) -> TelegramTask:
        """Reset a failed telegram task back to pending (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.telegram.reset_telegram_task(space_slug, number)

    async def list_telegram_mirrors(
        self, auth_token: AuthToken, space_slug: str | None = None, limit: int = 50, offset: int = 0
    ) -> PaginationResult[TelegramMirror]:
        """List telegram mirrors (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.telegram.list_telegram_mirrors(space_slug, limit, offset)

    async def get_telegram_mirror(self, auth_token: AuthToken, space_slug: str, note_number: int) -> TelegramMirror:
        """Get telegram mirror by natural key (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.telegram.get_telegram_mirror(space_slug, note_number)

    # --- Notes ---

    async def list_notes(
        self,
        auth_token: AuthToken,
        space_slug: str,
        filter_name: str | None = None,
        adhoc_query: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> PaginationResult[Note]:
        """List paginated notes in space (members only)."""
        user = await self._core.services.access.ensure_space_permission(auth_token, space_slug)
        return await self._core.services.note.list_notes(space_slug, user.username, filter_name, adhoc_query, limit, offset)

    async def get_note(self, auth_token: AuthToken, space_slug: str, number: int) -> Note:
        """Get specific note by number (members only)."""
        await self._core.services.access.ensure_space_permission(auth_token, space_slug)
        return await self._core.services.note.get_note(space_slug, number)

    async def create_note(self, auth_token: AuthToken, space_slug: str, raw_fields: dict[str, str]) -> Note:
        """Create note with custom fields (requires create_note permission)."""
        user = await self._core.services.access.ensure_space_permission(auth_token, space_slug, Permission.CREATE_NOTE)
        return await self._core.services.note.create_note(space_slug, user.username, raw_fields)

    async def update_note(self, auth_token: AuthToken, space_slug: str, number: int, raw_fields: dict[str, str]) -> Note:
        """Update specific note fields (requires create_note permission)."""
        user = await self._core.services.access.ensure_space_permission(auth_token, space_slug, Permission.CREATE_NOTE)
        note, _ = await self._core.services.note.update_note_fields(space_slug, number, raw_fields, user.username)
        return note

    async def transfer_note(self, auth_token: AuthToken, space_slug: str, number: int, target_space: str) -> Note:
        """Transfer note to another space (requires create_note permission)."""
        await self._core.services.access.ensure_space_permission(auth_token, space_slug, Permission.CREATE_NOTE)
        return await self._core.services.note.transfer_note(space_slug, number, target_space)

    # --- Comments ---

    async def list_comments(
        self, auth_token: AuthToken, space_slug: str, note_number: int, limit: int = 50, offset: int = 0
    ) -> PaginationResult[Comment]:
        """List paginated comments for a note (members only)."""
        await self._core.services.access.ensure_space_permission(auth_token, space_slug)
        return await self._core.services.comment.list_comments(space_slug, note_number, limit, offset)

    async def get_comment(self, auth_token: AuthToken, space_slug: str, note_number: int, number: int) -> Comment:
        """Get specific comment (members only)."""
        await self._core.services.access.ensure_space_permission(auth_token, space_slug)
        return await self._core.services.comment.get_comment(space_slug, note_number, number)

    async def create_comment(
        self,
        auth_token: AuthToken,
        space_slug: str,
        note_number: int,
        content: str,
        parent_number: int | None = None,
        raw_fields: dict[str, str] | None = None,
    ) -> Comment:
        """Create comment on a note, optionally updating fields (requires create_comment permission)."""
        user = await self._core.services.access.ensure_space_permission(auth_token, space_slug, Permission.CREATE_COMMENT)
        return await self._core.services.comment.create_comment(
            space_slug, note_number, user.username, content, parent_number, raw_fields
        )

    async def update_comment(
        self, auth_token: AuthToken, space_slug: str, note_number: int, number: int, content: str
    ) -> Comment:
        """Update comment content (author only)."""
        await self._core.services.access.ensure_comment_author(auth_token, space_slug, note_number, number)
        return await self._core.services.comment.update_comment(space_slug, note_number, number, content)

    async def delete_comment(self, auth_token: AuthToken, space_slug: str, note_number: int, number: int) -> None:
        """Delete comment (requires create_comment permission and authorship)."""
        await self._core.services.access.ensure_space_permission(auth_token, space_slug, Permission.CREATE_COMMENT)
        await self._core.services.access.ensure_comment_author(auth_token, space_slug, note_number, number)
        await self._core.services.comment.delete_comment(space_slug, note_number, number)

    # --- Attachments ---

    async def list_pending_attachments(
        self, auth_token: AuthToken, limit: int = 50, offset: int = 0
    ) -> PaginationResult[PendingAttachment]:
        """List all pending attachments (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.attachment.list_pending_attachments(limit, offset)

    async def upload_pending_attachment(
        self, auth_token: AuthToken, filename: str, content: bytes, mime_type: str
    ) -> PendingAttachment:
        """Upload file to pending storage (authenticated users only)."""
        user = await self._core.services.access.ensure_authenticated(auth_token)
        return await self._core.services.attachment.create_pending_attachment(user.username, filename, content, mime_type)

    async def delete_pending_attachment(self, auth_token: AuthToken, number: int) -> None:
        """Delete pending attachment (owner or admin only)."""
        await self._core.services.access.ensure_pending_attachment_owner_or_admin(auth_token, number)
        await self._core.services.attachment.delete_pending_attachment(number)

    async def upload_space_attachment(
        self, auth_token: AuthToken, space_slug: str, filename: str, content: bytes, mime_type: str
    ) -> Attachment:
        """Upload attachment to space (requires create_note permission)."""
        user = await self._core.services.access.ensure_space_permission(auth_token, space_slug, Permission.CREATE_NOTE)
        return await self._core.services.attachment.create_attachment(
            space_slug, None, user.username, filename, content, mime_type
        )

    async def upload_note_attachment(
        self, auth_token: AuthToken, space_slug: str, note_number: int, filename: str, content: bytes, mime_type: str
    ) -> Attachment:
        """Upload attachment to note (requires create_note permission)."""
        user = await self._core.services.access.ensure_space_permission(auth_token, space_slug, Permission.CREATE_NOTE)
        return await self._core.services.attachment.create_attachment(
            space_slug, note_number, user.username, filename, content, mime_type
        )

    async def list_space_attachments(self, auth_token: AuthToken, space_slug: str) -> list[Attachment]:
        """List space-level attachments (members only)."""
        await self._core.services.access.ensure_space_permission(auth_token, space_slug)
        return await self._core.services.attachment.list_space_attachments(space_slug)

    async def list_note_attachments(self, auth_token: AuthToken, space_slug: str, note_number: int) -> list[Attachment]:
        """List note attachments (members only)."""
        await self._core.services.access.ensure_space_permission(auth_token, space_slug)
        return await self._core.services.attachment.list_note_attachments(space_slug, note_number)

    async def download_pending_attachment(self, auth_token: AuthToken, number: int) -> tuple[PendingAttachment, bytes]:
        """Download pending attachment (owner or admin)."""
        _, pending = await self._core.services.access.ensure_pending_attachment_owner_or_admin(auth_token, number)
        content = attachment_storage.read_pending_attachment_file(self._core.config.attachments_path, number)
        return pending, content

    async def download_space_attachment(self, auth_token: AuthToken, space_slug: str, number: int) -> tuple[Attachment, bytes]:
        """Download space attachment (members only)."""
        await self._core.services.access.ensure_space_permission(auth_token, space_slug)
        attachment = await self._core.services.attachment.get_attachment(space_slug, None, number)
        content = attachment_storage.read_attachment_file(self._core.config.attachments_path, space_slug, None, number)
        return attachment, content

    async def download_note_attachment(
        self, auth_token: AuthToken, space_slug: str, note_number: int, number: int
    ) -> tuple[Attachment, bytes]:
        """Download note attachment (members only)."""
        await self._core.services.access.ensure_space_permission(auth_token, space_slug)
        attachment = await self._core.services.attachment.get_attachment(space_slug, note_number, number)
        content = attachment_storage.read_attachment_file(self._core.config.attachments_path, space_slug, note_number, number)
        return attachment, content

    # --- Images ---

    async def get_attachment_as_webp(
        self,
        auth_token: AuthToken,
        space_slug: str | None,
        note_number: int | None,
        attachment_number: int,
        options: WebpOptions,
    ) -> bytes:
        """Convert attachment to WebP. space_slug=None means pending attachment."""
        if space_slug is None:
            await self._core.services.access.ensure_pending_attachment_owner_or_admin(auth_token, attachment_number)
        else:
            await self._core.services.access.ensure_space_permission(auth_token, space_slug)
        return await self._core.services.image.get_attachment_as_webp(space_slug, note_number, attachment_number, options)

    async def get_image_path(self, auth_token: AuthToken, space_slug: str, note_number: int, field_name: str) -> Path:
        """Get path to pre-generated WebP image (members only)."""
        await self._core.services.access.ensure_space_permission(auth_token, space_slug)
        return await self._core.services.image.get_image_path(space_slug, note_number, field_name)

    # --- Export/Import ---

    async def export_space(self, auth_token: AuthToken, space_slug: str, include_data: bool) -> ExportData:
        """Export space configuration and optionally all data (space admin only)."""
        await self._core.services.access.ensure_space_admin(auth_token, space_slug)
        return await self._core.services.export.export_space(space_slug, include_data)

    async def import_space(self, auth_token: AuthToken, data: ExportData) -> Space:
        """Import space from export data (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.export.import_space(data)

    # --- Backups ---

    async def create_backup(self, auth_token: AuthToken) -> BackupInfo:
        """Create database backup (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.backup.create_backup()

    async def list_backups(self, auth_token: AuthToken) -> list[BackupInfo]:
        """List existing backups (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return self._core.services.backup.list_backups()

    async def get_backup_path(self, auth_token: AuthToken, filename: str) -> Path:
        """Get path to backup file for download (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return self._core.services.backup.get_backup_path(filename)

    async def delete_backup(self, auth_token: AuthToken, filename: str) -> None:
        """Delete a backup file (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        self._core.services.backup.delete_backup(filename)

    # --- Logs ---

    async def get_error_log(self, auth_token: AuthToken) -> ErrorLog:
        """Read current error log file content (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return self._core.services.log.get_error_log()
