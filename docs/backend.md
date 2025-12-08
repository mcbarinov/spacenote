# Backend Documentation

## Database Schema

### Collections

#### `users`
- `_id`: ObjectId (surrogate key, MongoDB internal use only)
- `username`: string (natural key, unique index)
- `password_hash`: string
- `created_at`: datetime

#### `sessions`
- `_id`: ObjectId (surrogate key, MongoDB internal use only)
- `username`: string (references user, indexed)
- `auth_token`: string (unique index)
- `created_at`: datetime (TTL index: 30 days)

#### `spaces`
- `_id`: ObjectId (surrogate key, MongoDB internal use only)
- `slug`: string (natural key, unique index)
- `title`: string
- `description`: string
- `members`: array of strings (usernames)
- `fields`: array of field definitions
- `created_at`: datetime

#### `notes`
- `_id`: ObjectId (surrogate key, MongoDB internal use only)
- `space_slug`: string (references space, indexed)
- `number`: integer (sequential per space)
- `author`: string (username of creator)
- `created_at`: datetime
- `edited_at`: datetime | null
- `fields`: object (custom field values)

#### `counters`
- `_id`: ObjectId (surrogate key, MongoDB internal use only)
- `space_slug`: string
- `counter_type`: string ("note" or "comment")
- `note_number`: integer | null (for note-scoped counters like comments)
- `seq`: integer
- Unique index: `(space_slug, counter_type, note_number)`

#### `comments`
- `_id`: ObjectId (surrogate key, MongoDB internal use only)
- `space_slug`: string
- `note_number`: integer (references note)
- `number`: integer (sequential per note)
- `author`: string (username)
- `content`: string
- `created_at`: datetime
- `edited_at`: datetime | null
- `parent_number`: integer | null (for threading)
- Unique index: `(space_slug, note_number, number)`

#### `pending_attachments`
- `_id`: ObjectId (surrogate key, MongoDB internal use only)
- `number`: integer (natural key, global sequential)
- `author`: string (username)
- `filename`: string (original filename)
- `size`: integer (bytes)
- `mime_type`: string
- `created_at`: datetime
- Storage: `pending/{number}`

#### `attachments`
- `_id`: ObjectId (surrogate key, MongoDB internal use only)
- `space_slug`: string (references space)
- `note_number`: integer | null (null = space-level attachment)
- `number`: integer (sequential per note or per space)
- `author`: string (username)
- `filename`: string (original filename)
- `size`: integer (bytes)
- `mime_type`: string
- `created_at`: datetime
- Natural key: `(space_slug, note_number, number)`
- Storage: `{space_slug}/{note_number}/{number}` or `{space_slug}/__space__/{number}`

## Architecture Decisions

### Natural Keys vs Surrogate Keys

**Implementation**: Natural keys are used as primary identifiers throughout the API and application code:

- `User` → identified by `username`
- `Space` → identified by `slug`
- `Note` → identified by `space_slug + number`

**Surrogate keys**: `_id: ObjectId` exists in all MongoDB documents but is used only internally by MongoDB, never in application code or API endpoints.

### Layered Architecture with App Facade

**Implementation**: Clear separation of concerns across layers:

```
FastAPI Routers → App Facade → Core Container → Services → MongoDB
```

- **Web layer** (`web/routers/`) handles HTTP concerns only (request/response, validation)
- **App Facade** (`app.py`) is the sole entry point to business logic
  - Validates authentication and permissions before delegating
  - Delegates to services (no business logic here)
  - Provides simplified API hiding Core complexity
- **Core Container** (`core/core.py`) manages lifecycle and provides ServiceRegistry
- **Services** (`core/modules/*/service.py`) execute business logic and database operations

### Service Registry & Lifecycle Management

Services are created without arguments and receive `Core` reference via injection:

```python
class ServiceRegistry:
    def __init__(self, core: Core) -> None:
        self.user = UserService()
        self.session = SessionService()
        # ... other services

        # Auto-discover and inject core
        self._services = [v for v in vars(self).values() if isinstance(v, Service)]
        for service in self._services:
            service.set_core(core)
```

**Lifecycle**: `Core.on_start()` → `ServiceRegistry.start_all()` → each `service.on_start()` (indexes, caches, defaults)

### Base Service Class

```python
class Service:
    def set_core(self, core: Core) -> None:
        self._core = core

    @property
    def core(self) -> Core:
        return self._core

    @property
    def database(self) -> AsyncDatabase:
        return self.core.database

    async def on_start(self) -> None: ...
    async def on_stop(self) -> None: ...
```

Services access each other via `self.core.services.other_service`.

### Service Collection Pattern

Services define MongoDB collections as `@cached_property` for lazy initialization:

```python
class NoteService(Service):
    @cached_property
    def _collection(self) -> AsyncCollection:
        return self.database.get_collection(Collection.NOTES)
```

Services with custom state use empty `__init__()`:

```python
class UserService(Service):
    def __init__(self) -> None:
        self._users: dict[str, User] = {}

    @cached_property
    def _collection(self) -> AsyncCollection:
        return self.database.get_collection(Collection.USERS)
```

### In-Memory Caching for Users and Spaces

Users and spaces are cached in memory (`dict[str, User]` and `dict[str, Space]`) due to small system limits (up to 10 users, up to 100 spaces).

- Cache loads on service startup via `on_start()`
- Reads served from cache (no DB queries)
- Updates call `update_*_cache()` to reload from DB
- Same approach used on frontend (TanStack Query cache)

### Image Processing

IMAGE fields store references to attachments and trigger WebP generation:

- On note create/update: pending attachment → permanent attachment
- Background task converts to WebP with optional resize (`max_width`)
- Storage: `{images_path}/{space_slug}/{note_number}/{attachment_number}`
- Originals preserved in attachment storage, processed WebP served via API

### Templates

Space templates stored in `templates` dict field:

- `note:title` — Liquid template for note title rendering
- `web:note:detail` — Liquid template for note detail view
- `web:note:list:{filter}` — Liquid template for note list with specific filter
- `web_react:note:detail` — React (react-live) design template for note detail
- `web_react:note:list:{filter}` — React (react-live) design template for note list

React templates are used in admin for design preview, then manually translated to Liquid.
