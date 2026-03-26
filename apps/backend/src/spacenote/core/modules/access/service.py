from spacenote.core.modules.attachment.models import PendingAttachment
from spacenote.core.modules.comment.models import Comment
from spacenote.core.modules.session.models import AuthToken
from spacenote.core.modules.space.models import Permission
from spacenote.core.modules.user.models import User
from spacenote.core.service import Service
from spacenote.errors import AccessDeniedError


class AccessService(Service):
    """Centralized access control and permission management."""

    async def ensure_authenticated(self, auth_token: AuthToken) -> User:
        """Verify user is authenticated."""
        return await self.core.services.session.get_authenticated_user(auth_token)

    async def ensure_admin(self, auth_token: AuthToken) -> User:
        """Verify user has admin privileges."""
        user = await self.core.services.session.get_authenticated_user(auth_token)
        if not user.is_admin:
            raise AccessDeniedError("Admin privileges required")
        return user

    async def ensure_space_admin(self, auth_token: AuthToken, space_slug: str) -> User:
        """Verify user has 'all' permission on space."""
        user = await self.core.services.session.get_authenticated_user(auth_token)
        space = self.core.services.space.get_space(space_slug)
        member = space.get_member(user.username)
        if not member or Permission.ALL not in member.permissions:
            raise AccessDeniedError("Space management permission required")
        return user

    async def ensure_space_permission(self, auth_token: AuthToken, space_slug: str, permission: Permission | None = None) -> User:
        """Verify user is a space member, optionally with a specific permission."""
        user = await self.core.services.session.get_authenticated_user(auth_token)
        space = self.core.services.space.get_space(space_slug)
        member = space.get_member(user.username)
        if not member:
            raise AccessDeniedError("Not a member of this space")
        if permission and Permission.ALL not in member.permissions and permission not in member.permissions:
            raise AccessDeniedError(f"Permission '{permission}' required")
        return user

    async def ensure_comment_author(
        self, auth_token: AuthToken, space_slug: str, note_number: int, comment_number: int
    ) -> tuple[User, Comment]:
        """Verify user is space member AND comment author."""
        user = await self.ensure_space_permission(auth_token, space_slug)
        comment = await self.core.services.comment.get_comment(space_slug, note_number, comment_number)
        if comment.author != user.username:
            raise AccessDeniedError("Only the author can modify this comment")
        return user, comment

    async def ensure_pending_attachment_owner(self, auth_token: AuthToken, number: int) -> tuple[User, PendingAttachment]:
        """Verify user owns the pending attachment."""
        user = await self.ensure_authenticated(auth_token)
        pending = await self.core.services.attachment.get_pending_attachment(number)
        if pending.author != user.username:
            raise AccessDeniedError("Only the owner can access this attachment")
        return user, pending

    async def ensure_pending_attachment_owner_or_admin(
        self, auth_token: AuthToken, number: int
    ) -> tuple[User, PendingAttachment]:
        """Verify user is admin or owns the pending attachment."""
        user = await self.ensure_authenticated(auth_token)
        pending = await self.core.services.attachment.get_pending_attachment(number)
        if not user.is_admin and user.username != pending.author:
            raise AccessDeniedError("Only the owner or admin can delete this attachment")
        return user, pending
