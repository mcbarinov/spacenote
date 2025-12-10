from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from spacenote.config import Config
from spacenote.core.core import Core
from spacenote.core.modules.attachment import storage as attachment_storage
from spacenote.core.modules.attachment.models import Attachment, PendingAttachment
from spacenote.core.modules.comment.models import Comment
from spacenote.core.modules.export.models import ExportData
from spacenote.core.modules.field.models import SpaceField
from spacenote.core.modules.filter.models import Filter
from spacenote.core.modules.image.processor import WebpOptions
from spacenote.core.modules.note.models import Note
from spacenote.core.modules.session.models import AuthToken
from spacenote.core.modules.space.models import Space
from spacenote.core.modules.telegram.models import (
    TelegramMirror,
    TelegramSettings,
    TelegramTask,
    TelegramTaskStatus,
    TelegramTaskType,
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

    async def create_user(self, auth_token: AuthToken, username: str, password: str) -> UserView:
        """Create new user (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        user = await self._core.services.user.create_user(username, password)
        return UserView.from_domain(user)

    async def delete_user(self, auth_token: AuthToken, username: str) -> None:
        """Delete user (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        await self._core.services.user.delete_user(username)

    # --- Spaces ---

    async def list_spaces(self, auth_token: AuthToken) -> list[Space]:
        """List spaces - all for admin, only member spaces for users."""
        user = await self._core.services.access.ensure_authenticated(auth_token)

        if user.username == "admin":
            return self._core.services.space.list_all_spaces()
        return self._core.services.space.list_user_spaces(user.username)

    async def create_space(self, auth_token: AuthToken, slug: str, title: str, description: str, members: list[str]) -> Space:
        """Create new space (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.space.create_space(slug, title, description, members)

    async def update_space_title(self, auth_token: AuthToken, slug: str, title: str) -> Space:
        """Update space title (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.space.update_title(slug, title)

    async def update_space_description(self, auth_token: AuthToken, slug: str, description: str) -> Space:
        """Update space description (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.space.update_description(slug, description)

    async def update_space_members(self, auth_token: AuthToken, slug: str, members: list[str]) -> Space:
        """Update space members (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.space.update_members(slug, members)

    async def update_hidden_fields_on_create(self, auth_token: AuthToken, slug: str, field_names: list[str]) -> Space:
        """Update hidden fields on create (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.space.update_hidden_fields_on_create(slug, field_names)

    async def delete_space(self, auth_token: AuthToken, slug: str) -> None:
        """Delete space (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        await self._core.services.space.delete_space(slug)

    # --- Templates ---

    async def set_space_template(self, auth_token: AuthToken, slug: str, key: str, content: str) -> Space:
        """Set or remove a template (admin only). Empty content removes the template."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.template.set_template(slug, key, content)

    # --- Fields ---

    async def add_field(self, auth_token: AuthToken, slug: str, field: SpaceField) -> SpaceField:
        """Add field to space (admin only). Returns validated field."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.field.add_field(slug, field)

    async def remove_field(self, auth_token: AuthToken, slug: str, field_name: str) -> None:
        """Remove field from space (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        await self._core.services.field.remove_field(slug, field_name)

    # --- Filters ---

    async def add_filter(self, auth_token: AuthToken, slug: str, filter: Filter) -> Filter:
        """Add filter to space (admin only). Returns validated filter."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.filter.add_filter(slug, filter)

    async def remove_filter(self, auth_token: AuthToken, slug: str, filter_name: str) -> None:
        """Remove filter from space (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        await self._core.services.filter.remove_filter(slug, filter_name)

    async def update_filter(self, auth_token: AuthToken, slug: str, filter_name: str, new_filter: Filter) -> Filter:
        """Update filter in space (admin only). Returns validated filter."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.filter.update_filter(slug, filter_name, new_filter)

    # --- Telegram ---

    async def update_space_telegram(self, auth_token: AuthToken, slug: str, telegram: TelegramSettings | None) -> Space:
        """Update space telegram settings (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.telegram.update_settings(slug, telegram)

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
        filter_name: str,
        adhoc_query: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> PaginationResult[Note]:
        """List paginated notes in space (members and admin)."""
        user = await self._core.services.access.ensure_space_reader(auth_token, space_slug)
        return await self._core.services.note.list_notes(space_slug, user.username, filter_name, adhoc_query, limit, offset)

    async def get_note(self, auth_token: AuthToken, space_slug: str, number: int) -> Note:
        """Get specific note by number (members and admin)."""
        await self._core.services.access.ensure_space_reader(auth_token, space_slug)
        return await self._core.services.note.get_note(space_slug, number)

    async def create_note(self, auth_token: AuthToken, space_slug: str, raw_fields: dict[str, str]) -> Note:
        """Create note with custom fields (members only)."""
        user = await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.note.create_note(space_slug, user.username, raw_fields)

    async def update_note(self, auth_token: AuthToken, space_slug: str, number: int, raw_fields: dict[str, str]) -> Note:
        """Update specific note fields (partial update, members only)."""
        user = await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.note.update_note_fields(space_slug, number, raw_fields, user.username)

    # --- Comments ---

    async def list_comments(
        self, auth_token: AuthToken, space_slug: str, note_number: int, limit: int = 50, offset: int = 0
    ) -> PaginationResult[Comment]:
        """List paginated comments for a note (members and admin)."""
        await self._core.services.access.ensure_space_reader(auth_token, space_slug)
        return await self._core.services.comment.list_comments(space_slug, note_number, limit, offset)

    async def get_comment(self, auth_token: AuthToken, space_slug: str, note_number: int, number: int) -> Comment:
        """Get specific comment (members and admin)."""
        await self._core.services.access.ensure_space_reader(auth_token, space_slug)
        return await self._core.services.comment.get_comment(space_slug, note_number, number)

    async def create_comment(
        self, auth_token: AuthToken, space_slug: str, note_number: int, content: str, parent_number: int | None = None
    ) -> Comment:
        """Create comment on a note (members only)."""
        user = await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.comment.create_comment(space_slug, note_number, user.username, content, parent_number)

    async def update_comment(
        self, auth_token: AuthToken, space_slug: str, note_number: int, number: int, content: str
    ) -> Comment:
        """Update comment content (author only)."""
        await self._core.services.access.ensure_comment_author(auth_token, space_slug, note_number, number)
        return await self._core.services.comment.update_comment(space_slug, note_number, number, content)

    async def delete_comment(self, auth_token: AuthToken, space_slug: str, note_number: int, number: int) -> None:
        """Delete comment (author only)."""
        await self._core.services.access.ensure_comment_author(auth_token, space_slug, note_number, number)
        await self._core.services.comment.delete_comment(space_slug, note_number, number)

    # --- Attachments ---

    async def upload_pending_attachment(
        self, auth_token: AuthToken, filename: str, content: bytes, mime_type: str
    ) -> PendingAttachment:
        """Upload file to pending storage (authenticated users only)."""
        user = await self._core.services.access.ensure_authenticated(auth_token)
        return await self._core.services.attachment.create_pending_attachment(user.username, filename, content, mime_type)

    async def upload_space_attachment(
        self, auth_token: AuthToken, space_slug: str, filename: str, content: bytes, mime_type: str
    ) -> Attachment:
        """Upload attachment to space (members only)."""
        user = await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.attachment.create_attachment(
            space_slug, None, user.username, filename, content, mime_type
        )

    async def upload_note_attachment(
        self, auth_token: AuthToken, space_slug: str, note_number: int, filename: str, content: bytes, mime_type: str
    ) -> Attachment:
        """Upload attachment to note (members only)."""
        user = await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.attachment.create_attachment(
            space_slug, note_number, user.username, filename, content, mime_type
        )

    async def list_space_attachments(self, auth_token: AuthToken, space_slug: str) -> list[Attachment]:
        """List space-level attachments (members and admin)."""
        await self._core.services.access.ensure_space_reader(auth_token, space_slug)
        return await self._core.services.attachment.list_space_attachments(space_slug)

    async def list_note_attachments(self, auth_token: AuthToken, space_slug: str, note_number: int) -> list[Attachment]:
        """List note attachments (members and admin)."""
        await self._core.services.access.ensure_space_reader(auth_token, space_slug)
        return await self._core.services.attachment.list_note_attachments(space_slug, note_number)

    async def download_pending_attachment(self, auth_token: AuthToken, number: int) -> tuple[PendingAttachment, bytes]:
        """Download pending attachment (owner only)."""
        _, pending = await self._core.services.access.ensure_pending_attachment_owner(auth_token, number)
        content = attachment_storage.read_pending_attachment_file(self._core.config.attachments_path, number)
        return pending, content

    async def download_space_attachment(self, auth_token: AuthToken, space_slug: str, number: int) -> tuple[Attachment, bytes]:
        """Download space attachment (members and admin)."""
        await self._core.services.access.ensure_space_reader(auth_token, space_slug)
        attachment = await self._core.services.attachment.get_attachment(space_slug, None, number)
        content = attachment_storage.read_attachment_file(self._core.config.attachments_path, space_slug, None, number)
        return attachment, content

    async def download_note_attachment(
        self, auth_token: AuthToken, space_slug: str, note_number: int, number: int
    ) -> tuple[Attachment, bytes]:
        """Download note attachment (members and admin)."""
        await self._core.services.access.ensure_space_reader(auth_token, space_slug)
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
            await self._core.services.access.ensure_pending_attachment_owner(auth_token, attachment_number)
        else:
            await self._core.services.access.ensure_space_reader(auth_token, space_slug)
        return await self._core.services.image.get_attachment_as_webp(space_slug, note_number, attachment_number, options)

    async def get_image_path(self, auth_token: AuthToken, space_slug: str, note_number: int, field_name: str) -> Path:
        """Get path to pre-generated WebP image (members and admin)."""
        await self._core.services.access.ensure_space_reader(auth_token, space_slug)
        return await self._core.services.image.get_image_path(space_slug, note_number, field_name)

    # --- Export/Import ---

    async def export_space(self, auth_token: AuthToken, space_slug: str, include_data: bool) -> ExportData:
        """Export space configuration and optionally all data (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.export.export_space(space_slug, include_data)

    async def import_space(self, auth_token: AuthToken, data: ExportData) -> Space:
        """Import space from export data (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        return await self._core.services.export.import_space(data)
