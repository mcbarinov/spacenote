from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from bson import ObjectId

from spacenote.core.comment.models import CommentView
from spacenote.core.config import CoreConfig
from spacenote.core.core import Core
from spacenote.core.errors import AuthenticationError
from spacenote.core.field.models import SpaceField
from spacenote.core.note.models import Note, NoteView
from spacenote.core.session.models import AuthToken
from spacenote.core.space.models import Space, SpaceView
from spacenote.core.user.models import User, UserView


class App:
    def __init__(self, config: CoreConfig) -> None:
        self._core = Core(config)

    @asynccontextmanager
    async def lifespan(self) -> AsyncGenerator[None]:
        """Application lifespan management - delegates to Core."""
        async with self._core.lifespan():
            yield

    async def is_auth_token_valid(self, auth_token: AuthToken) -> bool:
        user = await self._core.services.session.get_authenticated_user_or_none(auth_token)
        return user is not None

    async def login(self, username: str, password: str) -> AuthToken:
        if not self._core.services.user.verify_password(username, password):
            raise AuthenticationError
        user = self._resolve_user(username)
        return await self._core.services.session.create_session(user.id)

    async def logout(self, auth_token: AuthToken) -> None:
        await self._core.services.access.ensure_authenticated(auth_token)
        await self._core.services.session.invalidate_session(auth_token)

    async def get_current_user(self, auth_token: AuthToken) -> UserView:
        user = await self._core.services.access.ensure_authenticated(auth_token)
        return UserView.from_domain(user)

    async def get_all_users(self, auth_token: AuthToken) -> list[UserView]:
        """Get all users."""
        await self._core.services.access.ensure_authenticated(auth_token)
        users = self._core.services.user.get_all_users()
        return [UserView.from_domain(user) for user in users]

    async def create_user(self, auth_token: AuthToken, username: str, password: str) -> UserView:
        """Create a new user (admin only)."""
        await self._core.services.access.ensure_admin(auth_token)
        user = await self._core.services.user.create_user(username, password)
        return UserView.from_domain(user)

    async def get_spaces_by_member(self, auth_token: AuthToken) -> list[SpaceView]:
        current_user = await self._core.services.access.ensure_authenticated(auth_token)
        spaces = self._core.services.space.get_spaces_by_member(current_user.id)

        # Convert to view models with member usernames
        result = []
        for space in spaces:
            member_usernames = [self._core.services.user.get_user(member_id).username for member_id in space.members]
            result.append(SpaceView.from_domain(space, member_usernames))
        return result

    async def create_space(self, auth_token: AuthToken, slug: str, title: str) -> SpaceView:
        current_user = await self._core.services.access.ensure_authenticated(auth_token)
        space = await self._core.services.space.create_space(slug, title, current_user.id)
        member_usernames = [self._core.services.user.get_user(member_id).username for member_id in space.members]
        return SpaceView.from_domain(space, member_usernames)

    async def add_field_to_space(self, auth_token: AuthToken, space_slug: str, field: SpaceField) -> SpaceView:
        space = self._resolve_space(space_slug)
        await self._core.services.access.ensure_space_member(auth_token, space.id)
        updated_space = await self._core.services.space.add_field(space.id, field)
        member_usernames = [self._core.services.user.get_user(member_id).username for member_id in updated_space.members]
        return SpaceView.from_domain(updated_space, member_usernames)

    async def get_notes_by_space(self, auth_token: AuthToken, space_slug: str) -> list[NoteView]:
        space = self._resolve_space(space_slug)
        await self._core.services.access.ensure_space_member(auth_token, space.id)
        notes = await self._core.services.note.list_notes(space.id)

        # Convert to view models with author usernames
        result = []
        for note in notes:
            author = self._core.services.user.get_user(note.author_id)
            result.append(NoteView.from_domain(note, space_slug, author.username))
        return result

    async def get_note_by_number(self, auth_token: AuthToken, space_slug: str, number: int) -> NoteView:
        space = self._resolve_space(space_slug)
        await self._core.services.access.ensure_space_member(auth_token, space.id)
        note = await self._core.services.note.get_note_by_number(space.id, number)
        author = self._core.services.user.get_user(note.author_id)
        return NoteView.from_domain(note, space_slug, author.username)

    async def create_note(self, auth_token: AuthToken, space_slug: str, raw_fields: dict[str, str]) -> NoteView:
        space = self._resolve_space(space_slug)
        await self._core.services.access.ensure_space_member(auth_token, space.id)
        current_user = await self._core.services.access.ensure_authenticated(auth_token)
        note = await self._core.services.note.create_note(space.id, current_user.id, raw_fields)
        return NoteView.from_domain(note, space_slug, current_user.username)

    async def get_note_comments(self, auth_token: AuthToken, space_slug: str, note_number: int) -> list[CommentView]:
        space, note = await self._resolve_note(space_slug, note_number)
        await self._core.services.access.ensure_space_member(auth_token, space.id)
        comments = await self._core.services.comment.get_note_comments(note.id)

        # Convert to view models with author usernames
        comment_views = []
        for comment in comments:
            author = self._core.services.user.get_user(comment.author_id)
            comment_views.append(CommentView.from_domain(comment, space_slug, note_number, author.username))
        return comment_views

    async def create_comment(self, auth_token: AuthToken, space_slug: str, note_number: int, content: str) -> CommentView:
        space, note = await self._resolve_note(space_slug, note_number)
        await self._core.services.access.ensure_space_member(auth_token, space.id)
        current_user = await self._core.services.session.get_authenticated_user(auth_token)
        comment = await self._core.services.comment.create_comment(note.id, space.id, current_user.id, content)
        return CommentView.from_domain(comment, space_slug, note_number, current_user.username)

    async def update_space_members(self, auth_token: AuthToken, space_slug: str, usernames: list[str]) -> SpaceView:
        space = self._resolve_space(space_slug)
        await self._core.services.access.ensure_space_member(auth_token, space.id)

        # Resolve usernames to user IDs
        member_ids: list[ObjectId] = []
        for username in usernames:
            user = self._resolve_user(username)
            member_ids.append(user.id)

        updated_space = await self._core.services.space.update_members(space.id, member_ids)
        return SpaceView.from_domain(updated_space, usernames)

    # === Private resolver methods ===
    def _resolve_space(self, slug: str) -> Space:
        """Resolve space slug to Space object. Raises NotFoundError if not found."""
        return self._core.services.space.get_space_by_slug(slug)

    def _resolve_user(self, username: str) -> User:
        """Resolve username to User object. Raises NotFoundError if not found."""
        return self._core.services.user.get_user_by_username(username)

    async def _resolve_note(self, space_slug: str, number: int) -> tuple[Space, Note]:
        """Resolve space slug and note number to Space and Note objects."""
        space = self._resolve_space(space_slug)
        note = await self._core.services.note.get_note_by_number(space.id, number)
        return space, note
