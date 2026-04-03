from functools import cached_property
from typing import Any

import structlog
from pymongo.asynchronous.collection import AsyncCollection

from spacenote.core.db import Collection
from spacenote.core.modules.attachment import storage as attachment_storage
from spacenote.core.modules.field.validators import validate_transfer_schema_compatibility
from spacenote.core.modules.filter.models import ALL_FILTER_NAME, create_default_all_filter
from spacenote.core.modules.image import storage as image_storage
from spacenote.core.modules.space.models import Member, Permission, Space
from spacenote.core.service import Service
from spacenote.errors import NotFoundError, ValidationError

logger = structlog.get_logger(__name__)


class SpaceService(Service):
    """Manages spaces with in-memory cache and parent-child inheritance."""

    def __init__(self) -> None:
        # Raw documents from MongoDB — each space's own config without inheritance applied.
        self._space_documents: dict[str, Space] = {}
        # Resolved view — parent fields/filters/templates merged into child spaces.
        # All read operations use this cache; mutations use _space_documents for ownership checks.
        self._resolved_spaces: dict[str, Space] = {}

    @cached_property
    def _collection(self) -> AsyncCollection[dict[str, Any]]:
        return self.database.get_collection(Collection.SPACES)

    # --- Read ---

    def get_space(self, slug: str) -> Space:
        """Get resolved space by slug (with inherited fields/filters/templates merged in)."""
        if slug not in self._resolved_spaces:
            raise NotFoundError(f"Space '{slug}' not found")
        return self._resolved_spaces[slug]

    def get_space_document(self, slug: str) -> Space:
        """Get space as stored in MongoDB, without inheritance applied."""
        if slug not in self._space_documents:
            raise NotFoundError(f"Space '{slug}' not found")
        return self._space_documents[slug]

    def has_space(self, slug: str) -> bool:
        """Check if space exists by slug."""
        return slug in self._space_documents

    def list_all_spaces(self) -> list[Space]:
        """List all spaces from cache (resolved)."""
        return list(self._resolved_spaces.values())

    def list_user_spaces(self, username: str) -> list[Space]:
        """List resolved spaces where user is a member."""
        return [space for space in self._resolved_spaces.values() if space.has_member(username)]

    # --- Create ---

    async def create_space(
        self,
        slug: str,
        title: str,
        description: str,
        members: list[Member],
        source_space: str | None = None,
        parent: str | None = None,
    ) -> Space:
        """Create new space, optionally copying configuration from a source space or setting a parent."""
        if self.has_space(slug):
            raise ValidationError(f"Space '{slug}' already exists")

        self._validate_members(members)

        if source_space is not None and parent is not None:
            raise ValidationError("Cannot use both 'source_space' and 'parent'")

        if parent is not None:
            self._validate_parent(parent)

        if source_space is not None:
            if not self.has_space(source_space):
                raise ValidationError(f"Source space '{source_space}' not found")
            source = self.get_space_document(source_space)
            space = Space(
                slug=slug,
                title=title,
                description=description,
                members=members,
                fields=source.fields,
                filters=source.filters,
                default_filter=source.default_filter,
                hidden_fields_on_create=source.hidden_fields_on_create,
                editable_fields_on_comment=source.editable_fields_on_comment,
                templates=source.templates,
                can_transfer_to=source.can_transfer_to,
                timezone=source.timezone,
            )
        elif parent is not None:
            # Child space: no own filters — inherits parent's filters including "all"
            space = Space(
                slug=slug,
                parent=parent,
                title=title,
                description=description,
                members=members,
            )
        else:
            space = Space(
                slug=slug,
                title=title,
                description=description,
                members=members,
                filters=[create_default_all_filter()],
            )

        await self._collection.insert_one(space.to_mongo())
        return await self.update_space_cache(slug)

    async def import_space(self, space: Space) -> Space:
        """Insert pre-built space (for import)."""
        if self.has_space(space.slug):
            raise ValidationError(f"Space '{space.slug}' already exists")

        self._validate_members(space.members)

        if space.parent is not None:
            self._validate_parent(space.parent)

        # Ensure 'all' filter exists (skip for child spaces — they inherit it from parent)
        if space.parent is None and not any(f.name == ALL_FILTER_NAME for f in space.filters):
            space.filters.insert(0, create_default_all_filter())

        await self._collection.insert_one(space.to_mongo())
        return await self.update_space_cache(space.slug)

    # --- Update ---

    async def update_title(self, slug: str, title: str) -> Space:
        """Update space title."""
        self.get_space(slug)
        return await self.update_space_document(slug, {"$set": {"title": title}})

    async def update_description(self, slug: str, description: str) -> Space:
        """Update space description."""
        self.get_space(slug)
        return await self.update_space_document(slug, {"$set": {"description": description}})

    async def update_members(self, slug: str, members: list[Member]) -> Space:
        """Update space members."""
        self.get_space(slug)
        self._validate_members(members)
        return await self.update_space_document(slug, {"$set": {"members": [m.model_dump() for m in members]}})

    async def add_member(self, slug: str, username: str, permissions: list[Permission]) -> Space:
        """Add a member to space or update permissions if already a member."""
        space = self.get_space(slug)
        if not self.core.services.user.has_user(username):
            raise ValidationError(f"User '{username}' not found")

        members = list(space.members)
        existing = next((m for m in members if m.username == username), None)
        if existing:
            for perm in permissions:
                if perm not in existing.permissions:
                    existing.permissions.append(perm)
        else:
            members.append(Member(username=username, permissions=permissions))

        return await self.update_space_document(slug, {"$set": {"members": [m.model_dump() for m in members]}})

    async def remove_member(self, slug: str, username: str) -> Space:
        """Remove a member from space."""
        space = self.get_space(slug)
        members = [m for m in space.members if m.username != username]
        if len(members) == len(space.members):
            raise ValidationError(f"User '{username}' is not a member of space '{slug}'")
        return await self.update_space_document(slug, {"$set": {"members": [m.model_dump() for m in members]}})

    async def update_hidden_fields_on_create(self, slug: str, field_names: list[str]) -> Space:
        """Update hidden fields on create list."""
        space = self.get_space(slug)

        # Validate field names exist and can be hidden (optional or has default)
        fields_by_name = {f.name: f for f in space.fields}
        for name in field_names:
            field = fields_by_name.get(name)
            if field is None:
                raise ValidationError(f"Field '{name}' not found in space fields")
            if field.required and field.default is None:
                raise ValidationError(f"Field '{name}' is required and has no default value, cannot be hidden")

        return await self.update_space_document(slug, {"$set": {"hidden_fields_on_create": field_names}})

    async def update_editable_fields_on_comment(self, slug: str, field_names: list[str]) -> Space:
        """Update editable fields on comment list."""
        space = self.get_space(slug)

        # Validate field names exist
        fields_by_name = {f.name: f for f in space.fields}
        for name in field_names:
            if name not in fields_by_name:
                raise ValidationError(f"Field '{name}' not found in space fields")

        return await self.update_space_document(slug, {"$set": {"editable_fields_on_comment": field_names}})

    async def update_default_filter(self, slug: str, default_filter: str) -> Space:
        """Update default filter for the space."""
        space = self.get_space(slug)

        if not space.get_filter(default_filter):
            raise ValidationError(f"Filter '{default_filter}' not found in space")

        return await self.update_space_document(slug, {"$set": {"default_filter": default_filter}})

    async def update_can_transfer_to(self, slug: str, slugs: list[str]) -> Space:
        """Update the list of spaces where notes can be transferred to."""
        source = self.get_space(slug)

        for target_slug in slugs:
            if target_slug == slug:
                raise ValidationError(f"Cannot transfer to self ('{slug}')")
            if not self.has_space(target_slug):
                raise ValidationError(f"Space '{target_slug}' not found")
            validate_transfer_schema_compatibility(source, self.get_space(target_slug))

        return await self.update_space_document(slug, {"$set": {"can_transfer_to": slugs}})

    async def rename_slug(self, old_slug: str, new_slug: str) -> Space:
        """Rename space slug, updating all references across collections and file system."""
        self.get_space(old_slug)
        if self.has_space(new_slug):
            raise ValidationError(f"Space '{new_slug}' already exists")

        collections = [
            Collection.NOTES,
            Collection.COMMENTS,
            Collection.COUNTERS,
            Collection.ATTACHMENTS,
            Collection.TELEGRAM_TASKS,
            Collection.TELEGRAM_MIRRORS,
        ]
        for col_name in collections:
            await self.database.get_collection(col_name).update_many({"space_slug": old_slug}, {"$set": {"space_slug": new_slug}})

        await self._collection.update_one({"slug": old_slug}, {"$set": {"slug": new_slug}})

        # Update parent references in child spaces
        await self._collection.update_many({"parent": old_slug}, {"$set": {"parent": new_slug}})

        attachment_storage.rename_space_dir(self.core.config.attachments_path, old_slug, new_slug)
        image_storage.rename_space_dir(self.core.config.images_path, old_slug, new_slug)

        del self._space_documents[old_slug]
        self._resolved_spaces.pop(old_slug, None)

        # Reload all caches since children's parent references changed
        await self.update_all_spaces_cache()
        return self.get_space(new_slug)

    # --- Delete ---

    async def delete_space(self, slug: str) -> None:
        """Delete a space and all related data."""
        if not self.has_space(slug):
            raise NotFoundError(f"Space '{slug}' not found")

        children = self.get_child_slugs(slug)
        if children:
            raise ValidationError(f"Cannot delete space '{slug}': it is parent of {children}")

        await self.core.services.telegram.delete_telegram_tasks_by_space(slug)
        await self.core.services.telegram.delete_telegram_mirrors_by_space(slug)
        await self.core.services.attachment.delete_attachments_by_space(slug)
        self.core.services.image.delete_images_by_space(slug)
        await self.core.services.comment.delete_comments_by_space(slug)
        await self.core.services.note.delete_notes_by_space(slug)
        await self.core.services.counter.delete_counters_by_space(slug)
        await self._collection.delete_one({"slug": slug})
        del self._space_documents[slug]
        self._resolved_spaces.pop(slug, None)

    # --- Low-level ---

    async def update_space_document(
        self, slug: str, update: dict[str, Any], array_filters: list[dict[str, Any]] | None = None
    ) -> Space:
        """Low-level MongoDB update with automatic cache invalidation.

        Used internally by SpaceService update methods and by external feature services
        (FieldService, FilterService, etc.) that need to modify Space document.

        Caller is responsible for validating space exists (call get_space() first)
        and validating all data in the update operation.
        """
        await self._collection.update_one({"slug": slug}, update, array_filters=array_filters)
        return await self.update_space_cache(slug)

    # --- Validation ---

    def _validate_members(self, members: list[Member]) -> None:
        """Validate that all members exist in user cache."""
        for member in members:
            if not self.core.services.user.has_user(member.username):
                raise ValidationError(f"User '{member.username}' not found")

    def _validate_parent(self, parent_slug: str) -> None:
        """Validate that parent space exists and is not itself a child."""
        if not self.has_space(parent_slug):
            raise ValidationError(f"Parent space '{parent_slug}' not found")
        parent_space = self.get_space_document(parent_slug)
        if parent_space.parent is not None:
            raise ValidationError(f"Space '{parent_slug}' is already a child space and cannot be used as parent")

    # --- Inheritance ---

    def get_child_slugs(self, parent_slug: str) -> list[str]:
        """Get slugs of all spaces that have the given space as parent."""
        return [slug for slug, space in self._space_documents.items() if space.parent == parent_slug]

    def _resolve_space(self, space: Space) -> Space:
        """Compute resolved space by merging parent's fields/filters/templates into child."""
        if space.parent is None:
            return space

        parent = self._space_documents.get(space.parent)
        if parent is None:
            return space

        # Fields: parent fields first, then child's own fields appended at the end.
        # Child cannot override parent fields — name collisions are forbidden by validation.
        merged_fields = list(parent.fields) + list(space.fields)

        # Filters: merge parent and child filters by name.
        # If child has a filter with the same name as parent's — child's version wins (override).
        # Order: parent filters first (replaced by child override if exists), then child-only filters.
        child_filters = {f.name: f for f in space.filters}
        merged_filters = []
        seen_names: set[str] = set()
        for f in parent.filters:
            # Use child's override if it exists, otherwise keep parent's version
            merged_filters.append(child_filters.get(f.name, f))
            seen_names.add(f.name)
        # Append child-only filters (not overriding any parent filter)
        merged_filters.extend(f for f in space.filters if f.name not in seen_names)

        # Templates: merge by key, child overrides parent on same key
        merged_templates = {**parent.templates, **space.templates}

        return space.model_copy(
            update={
                "fields": merged_fields,
                "filters": merged_filters,
                "templates": merged_templates,
            }
        )

    def _rebuild_resolved_cache(self) -> None:
        """Rebuild all resolved spaces from raw cache."""
        self._resolved_spaces = {slug: self._resolve_space(space) for slug, space in self._space_documents.items()}

    # --- Cache ---

    async def update_all_spaces_cache(self) -> None:
        """Reload all spaces cache from database."""
        spaces = await Space.list_cursor(self._collection.find())
        self._space_documents = {space.slug: space for space in spaces}
        self._rebuild_resolved_cache()

    async def update_space_cache(self, slug: str) -> Space:
        """Reload a specific space cache from database and rebuild resolved cache."""
        space = await self._collection.find_one({"slug": slug})
        if space is None:
            raise NotFoundError(f"Space '{slug}' not found")
        self._space_documents[slug] = Space.model_validate(space)
        self._resolved_spaces[slug] = self._resolve_space(self._space_documents[slug])
        # If this space is a parent, its children inherit from it —
        # rebuild their resolved caches so they pick up the changes.
        if self._space_documents[slug].parent is None:
            for child_slug in self.get_child_slugs(slug):
                self._resolved_spaces[child_slug] = self._resolve_space(self._space_documents[child_slug])
        return self._resolved_spaces[slug]

    async def on_start(self) -> None:
        """Initialize indexes and cache."""
        await self._collection.create_index([("slug", 1)], unique=True)
        await self.update_all_spaces_cache()
        logger.debug("space_service_started", space_count=len(self._space_documents))
