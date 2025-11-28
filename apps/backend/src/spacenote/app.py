from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from spacenote.config import Config
from spacenote.core.core import Core
from spacenote.core.modules.attachment import storage as attachment_storage
from spacenote.core.modules.attachment.models import Attachment, PendingAttachment
from spacenote.core.modules.comment.models import Comment
from spacenote.core.modules.field.models import SpaceField
from spacenote.core.modules.image.processor import WebpOptions
from spacenote.core.modules.note.models import Note
from spacenote.core.modules.session.models import AuthToken
from spacenote.core.modules.space.models import Space
from spacenote.core.modules.user.models import UserView
from spacenote.core.pagination import PaginationResult
from spacenote.errors import AccessDeniedError, AuthenticationError


class App:
    """Facade for all application operations, validates permissions before delegating to Core."""

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

    async def get_current_user(self, auth_token: AuthToken) -> UserView:
        """Get current authenticated user profile."""
        user = await self._core.services.access.ensure_authenticated(auth_token)
        return UserView.from_domain(user)

    async def change_password(self, auth_token: AuthToken, old_password: str, new_password: str) -> None:
        """Change password for the current authenticated user."""
        user = await self._core.services.access.ensure_authenticated(auth_token)
        await self._core.services.user.change_password(user.username, old_password, new_password)

    async def get_all_users(self, auth_token: AuthToken) -> list[UserView]:
        """Get all users (requires authentication)."""
        await self._core.services.access.ensure_authenticated(auth_token)
        users = self._core.services.user.get_all_users()
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

    async def get_spaces(self, auth_token: AuthToken) -> list[Space]:
        """Get spaces - all for admin, only member spaces for users."""
        user = await self._core.services.access.ensure_authenticated(auth_token)

        if user.username == "admin":
            return self._core.services.space.get_all_spaces()
        return self._core.services.space.get_user_spaces(user.username)

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

    async def delete_space(self, auth_token: AuthToken, slug: str) -> None:
        """Delete space (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        await self._core.services.space.delete_space(slug)

    async def add_field_to_space(self, auth_token: AuthToken, slug: str, field: SpaceField) -> Space:
        """Add field to space (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        await self._core.services.field.add_field_to_space(slug, field)
        return self._core.services.space.get_space(slug)

    async def remove_field_from_space(self, auth_token: AuthToken, slug: str, field_name: str) -> None:
        """Remove field from space (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        await self._core.services.field.remove_field_from_space(slug, field_name)

    async def get_notes(self, auth_token: AuthToken, space_slug: str, limit: int = 50, offset: int = 0) -> PaginationResult[Note]:
        """Get paginated notes in space (members only)."""
        await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.note.list_notes(space_slug, limit, offset)

    async def get_note(self, auth_token: AuthToken, space_slug: str, number: int) -> Note:
        """Get specific note by number (members only)."""
        await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.note.get_note(space_slug, number)

    async def create_note(self, auth_token: AuthToken, space_slug: str, raw_fields: dict[str, str]) -> Note:
        """Create note with custom fields (members only)."""
        user = await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.note.create_note(space_slug, user.username, raw_fields)

    async def update_note(self, auth_token: AuthToken, space_slug: str, number: int, raw_fields: dict[str, str]) -> Note:
        """Update specific note fields (partial update, members only)."""
        user = await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.note.update_note_fields(space_slug, number, raw_fields, user.username)

    # Comments

    async def get_comments(
        self, auth_token: AuthToken, space_slug: str, note_number: int, limit: int = 50, offset: int = 0
    ) -> PaginationResult[Comment]:
        """Get paginated comments for a note (members only)."""
        await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.comment.list_comments(space_slug, note_number, limit, offset)

    async def get_comment(self, auth_token: AuthToken, space_slug: str, note_number: int, number: int) -> Comment:
        """Get specific comment (members only)."""
        await self._core.services.access.ensure_space_member(auth_token, space_slug)
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
        user = await self._core.services.access.ensure_space_member(auth_token, space_slug)
        comment = await self._core.services.comment.get_comment(space_slug, note_number, number)
        if comment.author != user.username:
            raise AccessDeniedError("Only the author can edit this comment")
        return await self._core.services.comment.update_comment(space_slug, note_number, number, content)

    async def delete_comment(self, auth_token: AuthToken, space_slug: str, note_number: int, number: int) -> None:
        """Delete comment (author only)."""
        user = await self._core.services.access.ensure_space_member(auth_token, space_slug)
        comment = await self._core.services.comment.get_comment(space_slug, note_number, number)
        if comment.author != user.username:
            raise AccessDeniedError("Only the author can delete this comment")
        await self._core.services.comment.delete_comment(space_slug, note_number, number)

    # Attachments

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

    async def get_space_attachments(self, auth_token: AuthToken, space_slug: str) -> list[Attachment]:
        """Get all space-level attachments (members only)."""
        await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.attachment.list_space_attachments(space_slug)

    async def get_note_attachments(self, auth_token: AuthToken, space_slug: str, note_number: int) -> list[Attachment]:
        """Get all attachments for a note (members only)."""
        await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.attachment.list_note_attachments(space_slug, note_number)

    async def download_pending_attachment(self, auth_token: AuthToken, number: int) -> tuple[PendingAttachment, bytes]:
        """Download pending attachment (owner only)."""
        user = await self._core.services.access.ensure_authenticated(auth_token)
        pending = await self._core.services.attachment.get_pending_attachment(number)
        if pending.author != user.username:
            raise AccessDeniedError("Only the owner can download this attachment")
        content = attachment_storage.read_pending_attachment_file(self._core.config.attachments_path, number)
        return pending, content

    async def download_space_attachment(self, auth_token: AuthToken, space_slug: str, number: int) -> tuple[Attachment, bytes]:
        """Download space attachment (members only)."""
        await self._core.services.access.ensure_space_member(auth_token, space_slug)
        attachment = await self._core.services.attachment.get_attachment(space_slug, None, number)
        content = attachment_storage.read_attachment_file(self._core.config.attachments_path, space_slug, None, number)
        return attachment, content

    async def download_note_attachment(
        self, auth_token: AuthToken, space_slug: str, note_number: int, number: int
    ) -> tuple[Attachment, bytes]:
        """Download note attachment (members only)."""
        await self._core.services.access.ensure_space_member(auth_token, space_slug)
        attachment = await self._core.services.attachment.get_attachment(space_slug, note_number, number)
        content = attachment_storage.read_attachment_file(self._core.config.attachments_path, space_slug, note_number, number)
        return attachment, content

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
            user = await self._core.services.access.ensure_authenticated(auth_token)
            pending = await self._core.services.attachment.get_pending_attachment(attachment_number)
            if pending.author != user.username:
                raise AccessDeniedError("Only the owner can access this attachment")
        else:
            await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.image.get_attachment_as_webp(space_slug, note_number, attachment_number, options)

    async def get_image_path(self, auth_token: AuthToken, space_slug: str, note_number: int, field_name: str) -> Path:
        """Get path to pre-generated WebP image (members only)."""
        await self._core.services.access.ensure_space_member(auth_token, space_slug)
        return await self._core.services.image.get_image_path(space_slug, note_number, field_name)
