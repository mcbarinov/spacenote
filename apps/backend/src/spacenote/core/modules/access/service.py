from spacenote.core.modules.attachment.models import PendingAttachment
from spacenote.core.modules.comment.models import Comment
from spacenote.core.modules.session.models import AuthToken
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
        if user.username != "admin":
            raise AccessDeniedError("Admin privileges required")
        return user

    async def ensure_space_member(self, auth_token: AuthToken, space_slug: str) -> User:
        """Verify user is a member of the specified space."""
        user = await self.core.services.session.get_authenticated_user(auth_token)
        space = self.core.services.space.get_space(space_slug)
        if user.username not in space.members:
            raise AccessDeniedError("Not a member of this space")
        return user

    async def ensure_space_reader(self, auth_token: AuthToken, space_slug: str) -> User:
        """Verify user can read space content (admin or member)."""
        user = await self.core.services.session.get_authenticated_user(auth_token)
        space = self.core.services.space.get_space(space_slug)
        if user.username == "admin":
            return user
        if user.username not in space.members:
            raise AccessDeniedError("Not a member of this space")
        return user

    async def ensure_comment_author(
        self, auth_token: AuthToken, space_slug: str, note_number: int, comment_number: int
    ) -> tuple[User, Comment]:
        """Verify user is space member AND comment author."""
        user = await self.ensure_space_member(auth_token, space_slug)
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
